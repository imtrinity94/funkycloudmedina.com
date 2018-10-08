---
title: "vCloud Director 9.5 UI - First impressions"
tags: ["VMware", "vCloud Director"]
date: 2018-10-08
draft: false
---
With the release of vCloud Director 9.5 I've gone ahead and upgraded my test environment from 9.1 (specifically 9.1.0.1) to 9.5.

Straight away I notice in the release notes that having a mix of vCloud Director appliances and Linux servers (with vCD installed) is not supported. There is also no supported migration method to move from Linux servers to the appliance. So, in place upgrade it is!

I won't go over the entire experience of using the HTML5 UI, only things I've noticed that are new in 9.5.

# Provider Portal

The provider portal is now much more fleshed out than 9.1. I can see all Organizations for the vCloud Director instance, and I can manage their Catalog abilities and vOrg policies (vApp leases, operation limits, password policies etc). As with 9.1, the Content Library is available to manage Service Libraries. Nothing has really changed here. I'm not sure what I was expecting, but nothing new.

A massive standout in the Provider portal is the addition of a "Recent Tasks" pane very similar to that in the vSphere Client. It lists any tasks triggered automatically by the system or other system administrators.

The Administration section now allows you to manage System level settings in the Provider portal. This is new in 9.5 and allows you to manage users, groups, roles, global roles, and something new called "Rights Bundles". You can also configure SAML and LDAP authentication settings for the System organization. Creating vOrgs in vCloud Director is now a single pop up, 1 second operation. It's very quick and uses the system default for policies and vApp leases.

If you have any extensions with UI components added to vCloud Director, they appear in the 'burger' menu at the top of the window now. For my test environment, the Operations Manager extension is shown.

It seems you cannot add/edit metadata on Organizations using the Provider Portal.

# Tenant Portal

Straight away I see the same "Recent Tasks" pane at the bottom of the Tenant portal. This is a huge addition and will be great for tenants with multiple active users in the Tenant Portal.

I've noticed that if the tenancy only has a single Org vDC, you will skip the "Virtual Datacenters" overview page and be sent directly to the Compute/Networking/Storage page. It's good to see these kinds of workflow efficiencies added so early in the UI rewrite.

The default vApp/VM view is still tiled, and while it can be changed to list (my preferred) vCloud doesn't remember this setting between sessions. I'll definitely submit this as a feature request!

Exploring vApp configurations is straight forward and definitely better than the Flash portal, but opening a VM configuration doesn't allow for easy opening of the console. From the VM settings, if I wanted to open the console, I have to go back to the parent vApp click the options button (three vertical dots) next to the VM and open the console.  The screenshot below shows an excellent empty space that could've been used to show a VM console thumbnail. It might just be me but the console is a very important offering within vCloud and I believe it needs to be highlighted for end users.

__Independent Disks__ are now available directly in the UI. Well, not entirely. You can create a new independent disk and provide a name, description, storage policy, __size in bytes__, bus type (SCSI, IDE or SATA) and bus sub-type (LSI Logic, Paravirtual etc). At first I didn't notice it, but going through it again, __size in bytes__? Why can I not select my unit and amount instead as if I were adding disk or memory directly to a VM? Obviously a bit more work to do here, but I can't complain too much as this was never in the flash UI. Moving on, the creation is straight forward but something that got to me was the page did not refresh to show the newly created disk. A manual refresh was required to see the new disk. You cannot edit the Bus type or sub-type after creation, but you can rename it and change the description. Delete the disk is straight foward. However, the Independent Disks page does not offer a method to add the disk to a VM. Neither does the VM hardware configuration page. It looks like you can't actually use the independent disks using the UI in this version.

There is also now a General section in the Org vDC view that shows you details of the active Org vDC (resources, allocation model, name etc).

It also appears that you cannot add an External Network as an Org vDC network for a tenant (even as a system administrator). I'm not sure if this was missed or if the functionality has been moved elsewhere.

__Storage Policies__ are viewable but you cannot edit the quota if one exists.

# Summary

The UI performance is multitudes better than the Flex UI which is expected. I'll be forever grateful to the vCD UI team for this move!

One thing that nags me though is that it feels unfinished not just in feature implementation but in the layout; UI elements on the page are either way too close or spread out too thin. The modal popups for information or event information are too small for the information they display, even on a widescreen. What's worse, the popups have a large amount of unused space, further reducing the readability of the information within as it gets wrapped.

It feels as if the UI has been written very quickly and the UI hasn't been tested by a human. The UX isn't terrible but it isn't great.

For a lot of service providers out there these UI problems don't impact them too much. They've automated almost all tasks as part of their customer management processes. But for tenants that want a powerful and elegant UI, it's still a few releases off but it can absolutely get the job done.

I know this will improve with time as the vCD UI team finds their feet and it has the building blocks of a great IAAS management UI. I can't wait to see what else they bring and I'm hoping to get involved in the next vCD beta to make sure I can offer more feedback earlier in the development process.

Let me know what your thoughts are in the comments.