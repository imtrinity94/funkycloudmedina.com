---
title: "vSphere 6 certificate templates with SHA256 encryption"
tags: ["VMware", "vSphere", "VCSA", "vCenter", "Certificates"]
categories: ["vSphere"]
date: 2017-01-10T10:00:00+10:00
draft: false
---

I was just in the middle of configuring a PSC 6.0 node’s VMCA as an intermediate CA and, in traditional fashion, went to request a certificate from a Windows Server 2008 R2 Microsoft CA using the web enrollment form (as per [this VMware KB article](https://kb.vmware.com/selfservice/search.do?cmd=displayKC&docType=kc&docTypeID=DT_KB_1_1&externalId=2112014)).

Oddly enough though my brand spanking new [vSphere 6.0 machine and intermediate CA certificate templates](https://kb.vmware.com/selfservice/search.do?cmd=displayKC&docType=kc&docTypeID=DT_KB_1_1&externalId=2112009) were missing from the template selection drop down.

I had a look around online and found that MS CA v3 certificate templates are not supported in the web enrollment form. Why is this relevant? Well, [this VMware KB](https://kb.vmware.com/selfservice/search.do?cmd=displayKC&docType=kc&docTypeID=DT_KB_1_1&externalId=2112009) states that if you use SHA256 encryption in your environment you must select __Windows Server 2008 Enterprise__ as your certificate template version. That instantly sets your certificate templates to v3.

Damn. How was I going to submit my CSR to this Microsoft CA and get back my certificates?! The Certificate Management snap-in doesn’t allow CSR files to be submitted. It’s just not an option.

Luckily we have the trusty certreq tool. I was easily able to submit my CSR file to the Microsoft CA and get a certificate back in a simple command:

`Certreq -submit -attrib "certificateTemplate:vSphere6.0VMCA" vmca_issued_csr.csr`

Make sure you specify the correct certificate template. In my example above, I was after the VMCA intermediate CA template. The file specified was in my cmd working directory and is the same file the PSC’s spit out when you’re using the certificate manager tool.