---
title: "Sending VM keystrokes using vRealize Orchestrator"
tags: ["VMware", "vRealize Orchestrator", "Javascript"]
date: 2018-09-11
draft: false
---
Last year the legendary William Lam ([Virtually Ghetto](https://www.virtuallyghetto.com)) posted a handy Powershell script that can use the vSphere 6.5 API's to send keyboard key strokes to a VM (https://www.virtuallyghetto.com/2017/09/automating-vm-keystrokes-using-the-vsphere-api-powercli.html).

I recently had a need for this feature but in vRealize Orchestrator and in Javascript instead of Powershell so I've re-written it in Javascript. I've included 2 additional script blocks that you can place into Scriptable Tasks or Actions too.

### Send a string as VM keystrokes to a VM Console
{{< gist TheNewStellW dc20e4d788c52185e1af8e3bd7e16e1a >}}

You'll need the following input parameters defined:

- Name: 'vm'
  - Type: VC:VirtualMachine
- Name: 'string'
  - Type: String

### Send CTRL+ALT+DELETE to a VM Console
{{< gist TheNewStellW ea71da549ca461f36a7528c18887caa0 >}}

You'll need only one input parameter defined:

- Name: 'vm'
  - Type: VC:VirtualMachine

### Send the carriage return keystroke to a VM Console

{{< gist TheNewStellW 830fc6ddac28e0ca74299b544f598b9c >}}

You'll need only one input parameter defined:

- Name: 'vm'
  - Type: VC:VirtualMachine

-----

I hope you find this as useful as I did.

A huge thanks to [William Lam](https://www.virtuallyghetto.com) for the source.