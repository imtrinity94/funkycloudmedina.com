---
title: "VclAbstractObjectValue - Unable to serialize object"
tags: ["VMware", "vCloud Director", "vRealize Orchestrator"]
date: 2018-08-23
draft: false
---
I've been working on some automation that will create metadata against objects in vCloud Director using vRealize Orchestrator. If you've ever had to do this before you'll know how painful it can be to get your head around all of the objects/transformations you need to make before you can even set the metadata to the object. 

First you take the metadata value (in this case a string) and create a new **VclMetadataStringValue** object. You need to then load this new object into a **VclAbstractValueObject** object before you can add it to your **VclMetadataEntry** object. 

I wanted to create an Action that would take the normal string value, create a **VclMetadataStringValue** from it, then load it into a **VclAbstractValueObject** object and return it to the calling workflow or action item. However, when doing this I got the following exception:

```text
ch.dunes.model.type.ConvertorException: Unable to serialize object of class : com.vmware.vmo.plugin.vcloud.model.VCloudAbstractObjectDecorator
```

It seems that when a function is attempting to return an object of type **VclAbstractValueObject** into a return type of **Any**, the Orchestrator engine fails to serialize the object. I've tested this quite a bit and can't find a way around it.

This means that you'll need to perform the **VclAbstractValueObject** transformation within the same function that creates your **VclMetadataEntry**.

Here are some examples.

This doesn't work:

```js
// Create new metadata value object
var vclMetadataStringValue = new VclMetadataStringValue();
vclMetadataStringValue.value = "stringData";
System.log("Metadata string value object created successfully with value: " + vclMetadataStringValue.value);

// Create abstract object of the metadata value
System.log("Creating vCloud Abstract Value Object...");
var vclAbstractValueObject = new VclAbstractValueObject();
vclAbstractValueObject.setValue(vclMetadataStringValue);

return vclAbstractValueObject;
```

If you run this code in an Action inside a workflow, you'll receive the previously mentioned exception.

However, if you run the same code in a Scriptable Task minus the **return** you can continue to work with the **VclAbstractValueObject** and set it in a **VclMetadataEntry** object.

It'll work if you do something like this instead in a larger scoped function:

```js
// Creates a vclMetadataStringValue object, a vclAbstractValueObject and a VclMetadataEntry object in 
// one function.

// Create new metadata value object
var vclMetadataStringValue = new VclMetadataStringValue();
vclMetadataStringValue.value = "stringData";

// Create abstract object of the metadata value
var vclAbstractValueObject = new VclAbstractValueObject();
vclAbstractValueObject.setValue(vclMetadataStringValue);

// New metadata object
var metadataObject = new VclMetadataEntry();

// Add object properties
metadataObject.key = "keystring";
metadataObject.typedValue = vclAbstractValueObject;

return metadataObject;
```

This is fine and it works but I was wanting to have a generic function to create **VclMetadataEntry** objects regardless of the type of metadata. Now I'll need to double up on the code, or I can write a switch statement based on the metadata provided to create different **VclMetadataXXXValue** objects based on the metadata value provided.