---
title: "Building a generic CentOS 7 template for vSphere and vCloud Director"
tags: ["VMware", "vSphere", "Linux", "CentOS", "vCloud Director", "Templates"]
date: 2017-12-12
draft: true
---
	1. Find latest version of CentOS supported by CassandraDB, RabbitMQ, vCloud Availability and vCloud Director
		a. CentOS 7 is supported
	2. VM Creation:
		a. CPU: 2 cores
		b. RAM: 4GB
		c. Storage: 20GB
		d. NIC: VMXNET3
	3. Installation
		a. CentOS minimal ISO
		b. Date & Time
			i. Locale: Brisbane, Australia
			ii. Time format: 24 hours
		c. Keyboard: US
		d. Language: English (Australia)
		e. Disk: Default
		f. Security: Default/None
		g. Default root password: P@55w0rd
	4. Network setup
		a. Nmtui - configure IPv4information on NIC (GW, DNS etc)
	5. Update
		a. Run yum install open-vm-tools
			i. Installs open source Vmware tools
			ii. Version installed on 11/12/2017 was 10.1.5-3.e17.x86_64
		b. Run yum update --skip-broken -y
			i. Updates packages while skipping others that have dependency problems or introduce problems to the currently installed packages
		c. Run yum install perl to download the latest version of Perl and all dependencies
			i. Required for open-vm-tools so that the guest OS customisation works
	6. Prepare for templating - combo of the following was used
		a. http://everything-virtual.com/2016/05/06/creating-a-centos-7-2-vmware-gold-template/
		b. https://gist.github.com/danjellesma/a60082f03ed60d438882
	7. Once VM is down, convert to template
Create and configure customisation spec