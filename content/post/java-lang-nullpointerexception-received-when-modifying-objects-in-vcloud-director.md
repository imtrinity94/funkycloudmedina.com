---
title: "‘java.lang.NullPointerException’ received when modifying objects in vCloud Director"
tags: ["VMware", "vCloud Director"]
date: 2017-03-20T11:36:00+10:00
draft: false
---

Roughly 2 weeks ago one of our vCloud Director tenants reported an error when attempting to increase a disk on their VM. They were told to contact their cloud administrator (yay). When we tried to perform the increase, we received an error we’d never seen before: “java.lang.NullPointerException”.

{{< fluid_imgs
  "pure-u-1-1|/images/java-null-pointer-exception-1.png"
>}}

Here is what we checked:

1. Confirm the tenant Org vDC has the appropriate resources available (this was an ‘Allocation’ style vDC).
2. Check the status of vCloud to vCenter connection and perform a vCenter Reconnect followed by a Refresh. This actually exposed another issue written about here.
3. Check Log Insight for entries similar to this. We found the entries, but even after viewing the log in context we couldn’t find a cause or correlated action.
4. We tested the same changes against other Org vDCs. We found that newly created test Org vDCs were fine and unaffected by whatever the root issue was. Only some of our existing Org vDCs experienced these issues.
5. We found that it wasn’t limited to disk changes. Performing any action on infrastructure within these affected Org vDCs resulted in the same error.

We spent longer than we should’ve trawling through the vCloud logs, and ended up logging an SR with VMware.

After going through the intricate details of what we were experiencing and the testing we’d performed, VMware requested a copy of our vCloud databases and a list of affected VMs, vApps and Org vDCs.

It was a nail biting few days, but eventually our assigned tech got back to us and found the cause of this error. There was a stale resgroup-id record in the org_prov_vdc table. Let me explain…

### Cause

There are 3 tables in the vCloud Director database that track Org vDC entities and their corresponding Org vDC resource pool and the parent vCenter resource pool. These 3 are supposed to be kept up to date/in sync by vCD:

* __vrp__ – this tracks Org vDC resource pool names in vCenter that correspond to Org vDCs. It also tracks the resource model (allocated, PAYG) and any compute resource settings that are applied to the resource pool.
* __vrp_rp__ – stores the vrp_id from the vrp table, along with the sub_rp_moref value for that vrp.
* __org_prov_vdc__ – stores data related more to the Org vDC entity itself (name, description, network pools, VM folder Moref IDs, resource pool Moref IDs etc)

Notice the bolded “resource pool Moref IDs” comment above. This is important, as this value should be the same as what’s stored in the sub_rp_moref column in the vrp_rp table.

__Disclaimer: all of the steps below were performed with VMware support.__

You can find out if a particular Org vDC has a stale record in the org_prov_vdc table by performing the following queries against your vCloud Director database:

```
SELECT id FROM vrp WHERE name LIKE '%My Org vDC Name%'
```

This will return the vrp ID for your Org vDC. Replace the bold ID in the following query with the ID you received in the last step:

```
SELECT sub_rp_moref FROM vrp_rp WHERE vrp_id = 0x31JSD81AA0923NAFV801234UASD2BF76
```

Note; this ID has been changed to protect the innocent. Yours will differ.

From the above SELECT query, you’ll get a resource group ID similar to this:

```
resgroup-6000
```

Run this query to find out what the current value is in org_prov_vdc table. Make sure to change the Org vDC name inside the percent signs.

```
SELECT sub_rp_moref FROM org_prov_vdc WHERE name LIKE '%My Org vDC Name%'
```

If the values from the vrp_rp table and the org_prov_vdc table do not match, then you’ve got a stale moref in the org_prov_vdc table.

### Fix

To fix this stale record take the resgroup ID, and the Org vDC name and run the following query:

```
UPDATE org_prov_vdc SET sub_rp_moref = 'resgroup-6000' where name = 'My Org vDC Name'
```

All done. You should now be able to make changes to your vCloud objects.

If you’d like to find all Org vDCs with stale moref IDs in the database, I’ve written a small query that can do that for you:

```
SELECT vrp.name as vrpNAME, org_prov_vdc.name as orgprovNAME, vrp_rp.sub_rp_moref as correctMOREF, org_prov_vdc.sub_rp_moref as staleMOREF
FROM vrp
 JOIN org_prov_vdc
 ON vrp.name LIKE '%' + org_prov_vdc.name + '%'
 JOIN vrp_rp
 ON vrp_rp.vrp_id = vrp.id
 
WHERE vrp_rp.sub_rp_moref != org_prov_vdc.sub_rp_moref
```
 
The root cause for all of this has not been found. I’m hoping VMware support can provide us with a little more information so I can update this post.

### Update
VMware were not able to provide us with a root cause, but we suspect our merging of multiple provider vDCs was the problem.