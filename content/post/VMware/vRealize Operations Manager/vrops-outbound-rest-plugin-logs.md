---
title: "vRealize Operations Manager - Outbound REST Notification log location"
tags: ["VMware", "vRealize Operations Manager", "REST"]
date: 2018-03-06
draft: false
---
A quick post today! I was trying to configure the vRealize Operations Manager Outbound REST notification plugin recently and I was having a few issues doing a POST or PUT operation against the specified endpoint. Specifically, I was getting the following message:

> Test was not successful: Failed to post or put to the server.

I tried looking around the vROPs Logs section under Administration > Support > Logs but couldn't find anything specific for Outbound Notification plugins. A spot of Googling left me with plenty of information about making a REST call **to** vROPs but nothing **from** it. 

So, without further delay, the Outbound notification logs are in the **anayltics** log files under **/data/vcops/log**. I usually run the following command to tail the analytics log files while I'm troubleshooting:

    tail -f analytics*.log | grep {hostname-your-POSTing-to}

Giant shoutout to **johndias** on the VMware {code} Slack channel who pointed me straight to this. It was too good not to share.