---
title: "Dell Bootable Firmware Update ISO - apply_updates.sh is invalid"
tags: ["Dell", "Hardware", "Firmware"]
date: 2017-09-08
draft: false
---
Today I hit a bit of a speed bump during some ESXi host upgrades. I like to roll out firmware upgrades while I'm upgrading ESXi, and some Dell M620's decided they didn't want to play ball.

I was using the Dell Bootable Firmware Update utility available [here](https://dell.app.box.com/v/BootableM620/1/24710093196). While the ISO was in fact bootable, none of the scripts or inventory collectors were able to run. Repeated attempts to mount the virtual CDROM would fail, followed by this message:

> /opt/dell/toolkit/systems/drm_files/apply_bundles.sh is invalid....

Quick search online gave me several suggestions to keep restarting the blade (?) and hope the updater would start. Nuts to that, I've got better things to do.

Thanks to user [ppcattoronto](https://en.community.dell.com/members/ppcattoronto) on the Dell Community site, there was a suggestion to manually mount the CDROM and execute the update script.

The following steps should be done after you've received the 'apply_updates.sh is invalid' message and you're at the "Press Enter to reboot" prompt.

1. Press ALT+F2 and press Enter to access a new console.
2. Type the following and press enter
```
mount /dev/cdrom /opt/dell/toolkit/systems
```

3. Type the following and press enter
```
./opt/dell/toolkit/systems/drm_files/apply_bundles.sh
```
4. The update script will start.

Again, big thanks to [ppcattoronto](https://en.community.dell.com/members/ppcattoronto) for this fix.