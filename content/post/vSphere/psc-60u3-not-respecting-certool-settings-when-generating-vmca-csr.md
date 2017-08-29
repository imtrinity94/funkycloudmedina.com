---
title: "PSC 6.0U3 not respecting certool.cfg settings when generating VMCA CSR"
tags: ["VMware", "vSphere", "vCenter", "PSC", "Certificates"]
date: 2017-04-26T17:46:00+10:00
draft: false
---

After a very successful and quick migration from Windows SSO 5.5 U3e installation to a Platform Services Controller v6.0U3 appliance I was ready to get my VMCA into action.

We have a corporate internal Microsoft CA with the VMware certificate templates already created as per [VMware KB 2112009](https://kb.vmware.com/selfservice/search.do?cmd=displayKC&docType=kc&docTypeID=DT_KB_1_1&externalId=2112009). Everything was coming up Milhouse, until CSR generation time using the 'certificate-manager' on the PSCs.

After stepping through the 'certificate-manager' wizard and having the CSR and private key files sent to a directory of my choosing, I quickly inspected the CSR using openssl to make sure I was on the right track:

```
openssl req -in vmca_issued_csr.csr -noout -text
```

My CSR still had the old self-signed details of the PSC node! Sure, it was marked as a certificate authority, but contained all the default VMware self-signed details.

I had a look in the VMware pubs (specifically [this bit](https://pubs.vmware.com/vsphere-60/index.jsp#com.vmware.vsphere.security.doc/GUID-4758F58D-2DF0-42EB-B9A0-28DF6C13F45E.html)) and found that it's possible to generate the CSR with my own config file. Using the "certool.cfg" template config file in __/usr/lib/vmware-vmca/share/config__, I quickly spun out a config file to match my VMCA node details and stuck it in /tmp for the time being.

Here is how you use certool command:

```
/usr/lib/vmware-vmca/bin/certool --gencsr --privkey={destination of private key} --pubkey={destination of public key} --csrfile={destination of new CSR} --config={the config file I created}
```
And here is what I ran:

```
/usr/lib/vmware-vmca/bin/certool --gencsr --privkey=/root/vmca_private.key --pubkey=/root/vmca_public.key --csrfile=/root/vmca_req.csr --config=/tmp/vmca.cfg
```

Obviously, you can name the files whatever you like.

While this seems like it should've worked and should churn out a VMCA compatible intermediate CSR, it doesn't. It only creates a CSR for a normal 'machine' certificate (compared to what I wanted which was a CA signing cert). I couldn't figure out the config requirements to generate a CSR for a CA. But how was the certificate-manager doing it?

Certificate-manager is actually generating a CSR from an existing certificate while using a config file to overwrite most of the parameters. The certificate it uses is the default VMCA self-signed root certificate, and the config file is made up from your answers in the certificate-manager wizard. Cool! Maybe I'll try this manually using the certool instead, thinking certificate-manager has regressed in Update 3. Referencing my previously crafted cartoon.cfg file in /tmp, here's what I ran:

```
/usr/lib/vmware-VMCA/bin/certool --gencsrfromexistingcert --privkey=/root/vmca_private.key --pubkey=/root/vmca_public.key --csrfile=/root/vmca_req.csr --certfile=/etc/vmware-vmca/*************
```

Unfortunately, this didn't work either. I still ended up with a CSR with all the details of a self signed VMCA. It definitely looks like the 6.0U3 certool has regressed and is experiencing a similar bug to 6.0U1 ([6.0U1 release notes](https://docs.vmware.com/en/VMware-vSphere/6.0/rn/vsphere-vcenter-server-60u1b-release-notes.html)).

The only way I was able to get around it was using a temporary 6.0U2 PSC machine and using the certificate-manager tool to create the CSR and private key. The CSR and key were taken off the temporary PSC, submitted and approved to my enterprise CA with great success. I was able to use the 6.0U3 certool to install the new VMCA intermediate certificate.

Let me know in the comments if you found a fix or are experiencing the same issue.