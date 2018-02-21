---
title: "My humble homelab - Version 1"
tags: ["Professional Development", "Homelab"]
date: 2018-02-21
draft: false
---

Like many professionals in this industry, I have a homelab. Who would need a homelab anymore with the cloud as prevalent as it is? Well, someone who specialises in private on-premises clouds and the work required to make it a hybrid cloud. And to be honest, I love it. I get to build something that is truly mine with my own constraints and requirements and still try to reach maximum usefulness for the hardware.

I haven't got much for my homelab, but it gets me by enough to study for exams or learn something new. Hell, it's great just to play with beta products or suites I don't use day to day at work.

Eventually I'd like to turn my homelab into a production house-serving centre that can offer files, services and automation for everyone.

I'm hoping to blog about my future homelab work and any additions that I make. Consider it practice for design and as-built documents ;)

Welcome to version 1.0 of my humble homelab.

# Hardware

My hardware footprint is quite small at the moment as I don't have the space, money or a penchant for massive electricity bills. My goal is to have a 32RU server rack act as one side of my study desk and store all of my hardware there. I don't know how my wife will feel about it... I guess we'll see once the rack is delivered...

## Compute

All my compute is offered by a used HP Z800 workstation. It has 2 x Intel Xeon processors and 40GB of DDR3 memory with a maximum of 192GB. It has 2 x internal SAS disks (RAID 0 - 300GB) and 2 x internal SATA disks (RAID 0 - 900GB) which is enough to run the VMs I need to while giving me two different performance profiles to choose from based on workload. It has 2 x Intel 1GBe NIC's but only one is currently connected.

My first goal for this machine is to rack it in a server rack and max out its memory. I'll be able to tell if it needs better CPUs from there.

## Storage

For the longest time I've had a QNAP TS-410 NAS server that served media to the devices in my house. Loaded with 4 x 2TB SATA disks this single device has been one of the greatest things I've bought. It acts as a downloading station for the myriad of lab software I use and it organises, stores and advertises the media it hosts to all the devices in my house.

The 8-9 year old CPU is woefully underpowered for today's use cases but it can still offer NFS, iSCSI and SMB storage natively and with very little noticeable performance problems. It's great as a host for my ISO's that I use in my homelab - just mount the ISO's folder as an NFS share to my ESXi host.

I recently nabbed a HP Microserver N54L with a few trash disks and 16GB of memory. It'll eventually replace the QNAP as the primary storage server for my home. I'm yet to find an OS or NAS appliance that can offer all the functionality and the ease of use of a QNAP.

## Networking

I have an incredibly basic networking setup. My entire house runs from an ISP-issued wireless router. All of my homelab network segregation and routing is done by a PFsense VM with VLAN trunking and virtual sub-interfaces.

I'd really love one of those Ubiquiti 24 port managed switches, but I don't think that fits in the budget. Maybe I'll settle for one those fanless HP 24 port L2/L3 managed switches.

# Software

I run the vSphere stack in my homelab as I find the hypervisor to be very lightweight for its capability and the management layer (VCSA) to have a smaller footprint over an equivalently featured System Center + Hyper-V deployment.

On top of vSphere I've got a couple of Windows Server 2016 deployments to run a domain controller and  management server (all of my tools etc).