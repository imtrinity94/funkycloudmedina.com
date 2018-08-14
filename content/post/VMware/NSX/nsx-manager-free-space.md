---
title: "NSX Manager upgrade reports no free space"
tags: ["VMware", "NSX"]
date: 2018-08-14
draft: true
---

Have you got an NSX Manager that's done the rounds for the past few years and served you well? Is it time for another upgrade but you're stuck because the disk is full and you've been told:

```
Cannot continue upgrade due to errors : Insufficient disk space. Database disk usage is at 87%, but it should be less than 70%. 
We recommend running a database full vacuum before proceeding with upgrade. Upgrade aborted.. Please correct before proceeding.
```

I've hit this today, and found something interesting that can happen if your NSX Manager has been around for quite some time. I found that the `/common/work/Catalina/localhost/_` directory stores incomplete update/upgrade uploads from the NSX management interface. If you've had a few uploads fail in the past or you've had to cancel them for another reason the files will reside here. Here's what mine looked like:

```
-rw-r--r-- 1 secureall secureall 2642174227 Jun  5  2017 upload_9279df10_3003_4ec3_970a_a636ebf546f4_00000001.tmp
-rw-r--r-- 1 secureall secureall 2596090936 Jun  5  2017 upload_9279df10_3003_4ec3_970a_a636ebf546f4_00000003.tmp
-rw-r--r-- 1 secureall secureall 2642174227 Jun  5  2017 upload_9279df10_3003_4ec3_970a_a636ebf546f4_00000005.tmp
-rw-r--r-- 1 secureall secureall 2297323520 Jun  5  2017 upload_9279df10_3003_4ec3_970a_a636ebf546f4_00000007.tmp
-rw-r--r-- 1 secureall secureall 2203289200 Jun  5  2017 upload_9279df10_3003_4ec3_970a_a636ebf546f4_00000009.tmp
-rw-r--r-- 1 secureall secureall 2203289200 Jun  5  2017 upload_9279df10_3003_4ec3_970a_a636ebf546f4_00000011.tmp
```

You can see the files were from last year during the last series of upgrades in this environment.

If you want to clear this directory you'll need to SSH to your NSX Manager. Warning: This is not supported by VMware and any changes made to the NSX Manager should only be done by GSS:

1. SSH to the NSX Manager
2. Enable Tech Support mode: https://kb.vmware.com/s/article/2149630
Protip: When the "st eng" command prompts for a password, it's asking for the "IAmOnThePhoneWithTechSupport" string.
3. Change directory to /common/work/Catalina/localhost/_
4. Clear out the temp files: rm ./*.tmp

Again, this isn't supported and I provide no warranty on this. However, it worked for me.