---
title: "How to restart the BMC on a Quanta server"
tags: ["Hardware", "Quanta", "IPMI", "BMC"]
date: 2018-08-06
draft: false
---

If you've ever been in a situation where your Quanta BMC is misbehaving and you need to reset it, you may have noticed that the built in CLI for remote management (SMASH) is missing **ipmiutil**, or at least it was on my machine.

To reset the BMC on a Quanta machine, SSH to the out of band IP address of the server.

Once you've logged in, run **show** to list the available 'targets' for the SMASH CLI. 

You should (at the very least) see 2 targets; **SP** and **SYS**. If you run **show {name-of-target}** then you'll see details of that target. For me, running **show sp** shows details of the BMC module (firmware versions etc). Running **show sys** lists details of the managed server like interface MAC addresses.

To reset the BMC of the server, run **reset sp**. The BMC module will be reset, your SSH session terminated and any web GUI sessions will time out.

It will take a few minutes for the BMC to start up and become available via the web and SSH.

### Pro tip: If you cannot login using your admin account

Thanks to a post on Twitter, you can SSH in using the **username: sysadmin** and the **password: superuser**

{{< tweet 455012918179160064 >}}

This took me some time as a lot of Quanta searches show the manufacturer website and plenty of whitebox rebranding making it all but impossible to find real documentation. Hence this articles existence.