---
title: "Unable to authenticate against LDAPS in vCloud Director 9.5"
tags: ["VMware", "vCloud Director", "Certificates"]
date: 2019-03-20
draft: false
---
I had a customer upgrade their vCloud Director environment from v8.20 to v9.5. The upgrade itself went fine, however some tenants were now unable to login. Interestingly, the affected tenants were authenticating against their own LDAP server over LDAPS. All other tenants were authenticating against the Service Provider managed LDAP server.

For this particular service provider customer and their tenant, the LDAP server was specified using an IP address instead of a FQDN. The **Accept all certificates** option was also selected as the IP address was not in the CN or SAN. This arrangement worked before the upgrade, but we're on the right track. It's definitely certificate related.

Let's check out the [vCloud Director v9.5 release notes](https://docs.vmware.com/en/VMware-vCloud-Director-for-Service-Providers/9.5/rn/vmware-vcloud-director-for-service-providers-95-release-notes.html). We can see under **Known Issues** there is a call out to LDAP over SSL failing:

```
LDAP over SSL connection fails

vCloud Director 9.5 uses Java 8 Update 181, which introduces improved LDAP support.

Workaround: Verify that you have a properly constructed SSL certificate. 
For information, see the Java 8 Release Changes at https://www.java.com.
```

Well that's somewhat useful but it doesn't give you any more information on what a properly constructed SSL certificate is. Let's check out the [Java 8 Release Changes](https://www.java.com/en/download/faq/release_changes.xml) as suggested. We can see under **Update 181** that there has been an improvement made to LDAP:

```
Java 8 Update 181 (8u181)
Release Highlights
    Change: Improve LDAP support
    Endpoint identification has been enabled on LDAPS connections.
    To improve the robustness of LDAPS (secure LDAP over TLS ) connections, endpoint identification algorithms have been enabled by default.
    Note that there may be situations where some applications that were previously able to successfully connect to an LDAPS server may no longer be able to do so. Such applications may, if they deem appropriate, disable endpoint identification using a new system property: com.sun.jndi.ldap.object.disableEndpointIdentification.
    Define this system property (or set it to true) to disable endpoint identification algorithms.
    JDK-8200666 (not public) 
```

Let's explore this a bit more. The last few years have seen changes in how client's connecting with SSL validate the endpoint they are connecting to. A valid certificate chain and Common Name (CN) were typically needed. Now? We need to have a valid SAN configured on certificates before the browser will accept it. Is this sounding familiar? It should, I've already written an [article around something similar](/2017/07/ca-signed-vcloud-director-certificates-no-longer-trusted-san-missing/).

For this particular tenant, the SSL certificate was signed by a public CA so the chain was OK but the IP address was not listed in the SAN or god forbid the CN. On v8.20, the "Accept all certificates" option was selected so the lack of IP in the certificate was 'skipped over'. The quick fix is to use the FQDN that matches the FQDN in the CN and SAN, which is what was done for this tenant. In the v9.5 world, everything worked just as expected **except** the Endpoint identification mechanism tried to validate the specified LDAP server IP address against the SAN and failed regardless of the certificate chain.

This highlights the importance of not just blindly renewing certificates when they're due but to really reconsider who or what will be consuming them and how so that you can avoid showstoppers like this.