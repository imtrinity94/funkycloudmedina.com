---
title: "Retrieve vCenter as an SdkConnection from vCloud Director in vRealize Orchestrator"
tags: ["VMware", "vCloud Director", "vRealize Orchestrator", "Javascript"]
date: 2018-10-04
draft: false
---
I've been working on some more automation lately for vCloud Director using vRealize Orchestrator. One of my use cases was to retrieve the SDK Connection scripting object for the linked vCenter Server. My starting point was an Org vDC, and from there I wanted to get the backing vCenter Server.

Let's start by getting the Provider vDC vCloud Reference object from the Org vDC scripting object (orgVDC):

```javascript
var providerRef = orgVDC.toAdminObject().providerVdcReference;
```

The __providerRef__ variable will now contain a VclReference that we can use query vCloud for the actual VclProviderVdc scripting object:

```javascript
var providerVdc = orgVDC.getHost().getEntityByReference(VclFinderType.PROVIDER_VDC, providerRef);
```

Cool, now the __providerVdc__ variable contains the VclProviderVdc scripting object.

Let's now get the VclObject and enumerate it. You'll also see the '[0]' at the end of the enumerate() method which grabs the first entry in the enumerated array (this is called the array index). I only bother grabbing the first one as my environment only has one vCenter Server linked to vCloud.

```javascript
var vCenterServer = providerVdc.toAdminExtensionObject().vimServer.enumerate()[0];
```

The returned object will be another VclReference that we need to again do a lookup for:

```javascript
var obj = orgVDC.getHost().getEntityByReference(VclFinderType.VIM_SERVER, vCenterServer);
```

Nice, our __obj__ var now holds the VclVimServer scripting object. But that's not enough, we need the SdkConnection. Let's grab the UUID of the vCenter Server from the VclVimServer object:

```javascript
var vcUuid = obj.uuid;
```

Finally, let's use VcPlugin to get the SdkConnection object from a UUID:

```javascript
var vCenter = VcPlugin.findSdkConnectionForUUID(vcUuid);
```

Done! Our __vCenter__ variable now contains the VC:SdkConnection scripting object.

Altogther for those that want the code in block:

```javascript
var providerRef = orgVDC.toAdminObject().providerVdcReference;
var providerVdc = orgVDC.getHost().getEntityByReference(VclFinderType.PROVIDER_VDC, providerRef);
var vCenterServer = providerVdc.toAdminExtensionObject().vimServer.enumerate()[0];
var obj = orgVDC.getHost().getEntityByReference(VclFinderType.VIM_SERVER, vCenterServer);
var vcUuid = obj.uuid;
var vCenter = VcPlugin.findSdkConnectionForUUID(vcUuid);
```