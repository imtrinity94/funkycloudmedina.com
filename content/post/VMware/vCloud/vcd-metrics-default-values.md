---
title: "vCloud Director metrics - unable to configure metric, conflicts with existing column"
tags: ["VMware", "vCloud Director", "CassandraDB"]
date: 2018-08-20
draft: false
---
Recently I spent some time configuring vCloud Director metrics and storing them in a Cassandra cluster. If you have ever stepped outside of the default metrics and tried to provide your own via a Groovy file, you may have hit the following error in the `cell-management-tool.log` log:

```txt
Invalid column name **metric** because it conflicts with an existing column
```

If your Groovy file contains the metric listed in the error message and you've only listed it once, you're probably thinking "where on earth is this duplicate coming from?". Well...

vCloud Director stores a list of default metrics that will be sent to the Cassandra cluster in the event you don't provide a Groovy file during configuration. Your groovy file must not conflict with the default metrics that vCloud Director is already aware of. So, all you need to do is remove the *vCloud Director default* metric values from your Groovy file. How do you know which ones are the defaults? [Tomas Fojta (almost) has us covered](https://fojta.wordpress.com/2017/11/24/how-to-configure-additional-vm-metrics-in-vcloud-director/). 

As Tomas points out, the default metric names are stored in the vCloud Director database under the table "metric_configuration". If your SQL database is handled by SQL admins and you can't get to this table, you're at their mercy (I know what that can be like). So I decided to list them here:

- cpu.usagemhz.average
- disk.provisioned.latest
- disk.read.average
- mem.usage.average
- cpu.usage.maximum
- disk.used.latest
- disk.write.average
- cpu.usage.average

Make sure these aren't in your Groovy file and you should be a happy camper.