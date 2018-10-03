---
title: "vRO 7.5 Upgrade/Migration - Failed to validate the source vRealize Orchestrator database."
tags: ["VMware", "vRealize Orchestrator"]
date: 2018-09-27
draft: false
---
I've got a standalone vRealize Orchestrator 7.4 instance in my test environment and with the release of vRealize Orchestrator 7.5 I wanted to run through the upgrade. If you haven't noticed already, it's a migration to a new appliance not an in-place upgrade. This means the new vRO instance will need to connect to the existing vRO appliance and pull all of the data.

When I tried doing my migration/upgrade, I got the following error message during the validation phase:

    Failed to validate the source vRealize Orchestrator database.
        org.postgresql.util.PSQLException: Connection to {fqnd-or-ipaddress}:5432 refused. Check th

Frustratingly, the error message cuts off in the UI and doesn't show the full error or steps forward. Downloading the validation results HTML gives me the same snippet, along with the cut off error message.

I couldn't find anyone online with the same error message. I assumed it had to do with the internal vPostgres database on the source appliance so I started digging around the vPostgres config file located here:

    /storage/db/pgdata/postgresql.conf

A particular line of interest was the listen_address config, or lack thereof. The parameter listed in my conf file had 'listen_address' hashed out. I removed the hash and restarted vPostgres service:

    service vpostgres restart

Cool, nothing broke too extravagantly, let's try the upgrade/migration validation again.

OK, still no luck but a wildly different error message this time:

    The database configured on the source vRealize Orchestator appliance [{fqdn}] is not accessible. If the external Orchestrator server from which you want to migrate uses built-in PostgreSQL database, edit its database configuration files.
    1. Append a line to the /var/vmware/vpostgres/current/pgdata/postgresql.conf file. listen_addresses ='*'
    2. Append a line to the /var/vmware/vpostgres/current/pgdata/pg_hba.conf file. host all all {ip-of-new-vro-appliance}/32 md5
    3. Restart the PostgreSQL server service. service vpostgres restart

Excellent, an actual error with some steps. Alright, I've already done the first step. The second and third steps are pretty self explanatory. Once I did that second step and restarted the service my validation was successful and I was off to vRO 7.5.