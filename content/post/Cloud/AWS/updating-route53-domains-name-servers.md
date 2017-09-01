---
title: "Updating a Route53 domain's Name Servers"
tags: ["AWS", "Route53", "DNS"]
date: 2017-09-01
draft: false
---

I recently had the need to update an AWS Route53 domain NS configuration so that it could be protected by CloudFlare. This domain was purchased via Route53. I had updated the hosted zone NS records with the new Name Servers, but the domain continued to point to AWS and it drove me nuts. Turns out there is another section in Route53 where you updated the NS records for your Route53 managed domain.

Here's the process start to end for Route53. I won't go into detail on Cloudflare changes, I'm just assuming you've already registered and have the Cloudflare NS names.

1. Login to AWS Route53 console: https://console.aws.amazon.com/route53
2. Select "Hosted Zones" on the left, and select the domain you wish to update
3. Select the "NS" type record, and update the listed name servers to point to your name servers of choice.
4. Save the record set.
5. In the Route53 console, click "Registered domains" on the left.
6. Select your registered domain.
7. Towards the top right of the page, you'll see the original AWS name servers. Click "Add or edit name servers".
8. Enter the same name servers as step 3.
9. AWS will process your domain change request.

After a few minutes (or hours) Cloudflare will pick up the changes and begin serving your site.