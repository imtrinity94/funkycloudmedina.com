---
title: "Empty inventory after SSO v5.5 to PSC v6.0 U3 migration"
tags: ["VMware", "vSphere", "vCenter", "PSC"]
date: 2017-04-24T07:46:00+10:00
draft: false
---

After performing the vSphere v5.5 to vSphere 6.0 migration in our testing environment with great success, I began work on our production environment. First things first, migrating Windows SSO to PSC appliance.

I had successfully converted the first machine, and started doing some testing. Things like logging into the thick client and checking all vCenter servers and basic login services.

__Problem__

Out of 6 vCenter servers, only 1 was having issues. Logging in with the SSO administrator account I was able to see entire inventory and all services were running just fine. However, attempting to login with my org’s domain account was met with some generic “You do not have permissions to login”. Quickly jumping over to the SSO administrator session, the permissions for the affected vCenter were completely gone, only the SSO admin was listed as an administrator.

__Cause__

All vCenter servers have a security setting called Active Directory Validation. Essentially, this setting will perform a synchronization of AD users and groups every X minutes with the domain that vCenter is connected to. If vCenter is unable to perform the validation (SSO is unavailable, for example) then vCenter will remove all invalidated users and groups. For my environment, vCenter was set to sync every 24 hours. This timer begins when the vCenter service starts.

In what may be the worst timing ever, I had restarted the vCenter server roughly 24 hours before I had performed my SSO->PSC migration. This resulted in vCenter attempting to validate just as SSO had become unavailable during the migration. Goodbye user and group permissions.

__Fix__

To get this vCenter usable, I ended up just re-adding the required ACLs to vCenter for the time being. Although, I did find a VMware KB article on how to restore your permissions from a vCenter DB backup: [KB2086548](https://kb.vmware.com/selfservice/microsites/search.do?language=en_US&cmd=displayKC&externalId=2086548&src=vmw_so_vex_cchua_892)

If you want to prevent this from happening on your vCenter servers, just disable the AD validation setting until you’ve finished your migrations.