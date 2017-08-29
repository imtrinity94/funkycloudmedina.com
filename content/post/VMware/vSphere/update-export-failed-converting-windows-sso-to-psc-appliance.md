---
title: "Update Export Failed – Converting Windows SSO to PSC Appliance"
tags: ["VMware", "vSphere", "VCSA", "vCenter"]
date: 2016-12-21T17:00:00+10:00
draft: false
---
This isn’t a be all and end all post on converting your Windows-based SSO server to the Platform Services Controller appliance, although I found an issue when performing the migration.

We kept receiving an “Update export failed” message when the appliance was deployed by the conversion wizard. We couldn’t understand why, and the appliance updaterunner.log file gave us no clues as to what it could be.

Turns out, you __must__ run the vcsa_setup.html wizard with the same domain user/admin account that you started the Migration-Assistance.exe process with.