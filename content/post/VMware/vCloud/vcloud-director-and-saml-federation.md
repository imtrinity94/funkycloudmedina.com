---
title: "vCloud Director and SAML Federation"
tags: ["VMware", "vCloud Director", "Federation"]
date: 2016-12-12T15:28:00+10:00
draft: false
---

I had a few issues getting vCloud Director and SAML federation playing nicely. By issues, I mean there wasn’t an explicit how-to in VMware’s doco. The big issues were group-based authentication and authenticating against a user's email address instead of their UPN.

Using the following article from pablovirtualization I was able to get vCloud Director federated to an ADFS SAML endpoint.

https://pablovirtualization.wordpress.com/2015/01/13/vcloud-director-and-microsoft-ad-fs-active-director-federation-service-authentication/

This allowed users to login using their UPN. That’s all well and good until you need users to log into their account using their email address which may differ from their UPN.

### Enable login via email address

First, if you haven’t already due to some other requirement, allow your ADFS deployment to use the ‘mail’ attribute as an alternate login ID:

`Set-ADFSClaimsProviderTrust -TargetIdentifier “AD AUTHORITY” -alternateloginID mail -lookupforest {your forest fqdn here} e.g contoso.corp`

Now, brief difference between Pablo’s steps and this. When configuring the NameID transformation rule you’ll need to specify “Email” instead of “Unspecified”

{{< fluid_imgs
  "pure-u-1-1|/images/adfs-transform-rule-1.png"
>}}

### Group-based authentication

While you’re still adding transform rules, make sure you add this one too:

{{< fluid_imgs
  "pure-u-1-1|/images/adfs-transform-rule-2.png"
>}}

Now all you have to do is enter the group name when importing groups in vCloud Director. Any users that are a member of that group will be able to login and receive the role specified when importing the group.