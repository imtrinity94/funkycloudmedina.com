---
title: "Poor performance generating entropy in a VM from /dev/random"
tags: ["VMware", "vSphere", "ESXi", "CPU"]
date: 2018-11-20
draft: false
---
Just recently a few colleagues of mine were attempting to generate new private keys with a 4096 bit size but they were seeing shocking performance from all of their Linux VMs.

They were seeing key generation taking up to 15 minutes while smashing away at the keyboard to generate entropy. It wasn't a resource issue, the VMs were sized appropriately and showed no signs of stress. They asked me if they could throw a "Chaos Key" USB device into each of the ESXi hosts to generate more entropy to reduce the time it takes, but I knew that wasn't required (like I was going to let that happen). Something else was going but I didn't have an immediate answer.

I started looking around online to find out how entropy is generated on phyiscal machines and to try and find out VMware's official stance on how this functions in the virtual world. I found [this FAQ](https://vspherecentral.vmware.com/t/security/encryption/vsphere-6-5-vm-and-vsan-encryption-faq/) on vSphere Central that highlights how entropy is generated in the ESXi and VM world.

Looking at that article, you can see that ESXi will pass through calls to the RDRAND and RDSEED CPU instructions from a VM as long as the virtual hardware version is v9 and above, and the physical CPU's support. Well, these VMs are at v10 so it can't be that.

I quickly have a look online to find out if our current CPU model (E5-2670 v3) supports these instructions. Intel's ARK site only lists their brand names for the security features, not exact CPU instructions that are supported. I'm sure that specific information is available somewhere but I couldn't find it easily.

I have a look online for the CPU platform for these CPU's (Haswell) and end up on [Wikipedia](https://en.wikipedia.org/wiki/Ivy_Bridge_(microarchitecture)) where I can see that Ivy Bridge introduced the RDRAND instruction. Ivy Bridge was released before Haswell! Excellent, it looks like our CPU's support the instructions.

So why isn't it working?

**EVC**!

Our cluster had EVC set to **Sandy Bridge** instead of the latest available to the cluster. To be fair, EVC wasn't broken, it was working exactly as designed. This was clearly a leftover configuration from a previous migration. Setting EVC to Haswell and restarting the target VMs fixed the issue! Key generation dropped down to a few seconds!

I thought it would be best to post this as I initially couldn't find much "issues" with entropy in VMs on ESXi. Which, thinking about it, is probably due to everyone already checking EVC and fixing their own problem!