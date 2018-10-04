---
title: "SYSTEM_REFRESH_VIMSERVER – Could not register vCloud Director as an extension to vCenter Server"
tags: ["VMware", "vCloud Director", "vCenter"]
date: 2017-03-20T13:30:00+10:00
draft: false
---

While trying to troubleshoot another problem, we tried Refreshing vCloud to vCenter which includes registering/updating the extension. This is when we hit a beauty we’d never seen before:

![system-refresh-vimserver.png](/images/system-refresh-vimserver.png)

Alright, calm down. Probably something with the network, right? And  if it’s not the network then it’s probably DNS. Right? Oh how I wish that were so.

I dug around in the vCenter MOB and found the vCloud Director extension. As expected it already had a “vCloud Director-1” named extension. What I found odd was the last heartbeat time was back in 2013. Interestingly enough the last version recorded was also v5.1.2. I say interestingly because we are running v8.10.1 for SP.

Jumping into our test environment, I performed a Refresh of our test vCloud instance to vCenter and lo and behold it happened there too! I couldn’t find anything in the vCloud logs reporting the why behind this failure, but I needed to get this running, and quick too!

Knowing that the vCloud DB stores its own references to the vCenter MOB, and that vCloud would try to register itself as vCloud Director-1 again, I theorised that we could remove the existing extension and perform another Refresh without causing any issues.

So, that’s what I did right in the test environment. It went without a hitch. Rolled the same change out in production and it went beautifully.

If you’re getting this error, I’d suggest taking a backup of your vCenter server/DB and removing the existing vCloud Director extension.

Removing the extension (from [KB1025360](https://kb.vmware.com/selfservice/microsites/search.do?language=en_US&cmd=displayKC&externalId=1025360)):

As always, take a backup and a snapshot of your vCenter Server and DB before doing this.

1. In a web browser, navigate to http://vCenter_Server_name_or_IP/mob.
  * Where vCenter_Server_name_or_IP/mob is the name of your vCenter Server or its IP address.
2. Click Content.
3. Click ExtensionManager.
4. Select and copy the name of the plug-in you want to remove from the list of values under Properties.
5. Click UnregisterExtension. A new window appears.
6. Paste the key of the plug-in and click Invoke Method. This removes the plug-in and returns a void result.
7. Close the window.
8. Refresh the Managed Object Type:ManagedObjectReference:ExtensionManager window to verify that the plug-in is removed successfully