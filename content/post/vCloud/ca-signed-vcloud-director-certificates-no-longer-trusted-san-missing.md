---
title: "CA-signed vCloud Director certificates no longer trusted – SAN missing"
tags: ["VMware", "vCloud Director", "Certificates"]
date: 2017-07-07T17:43:00+10:00
draft: false
---

Hello again! Today's adventures drove me a little wild...

Some background first. In my test environment, I have a full vCloud Director v8.10.1 deployment, load balanced with an F5 LTM. The certificates are loaded on the F5 so that traffic is terminated and re-encrypted on it's way to the vCloud cells. Since deployment, both the http and console FQDNs functioned as expected. This all changed just a few months ago...

Some users of the test vCloud deployment reported certificate validation errors when accessing the 'http' site for vCloud. They also reported that the console had stopped working. I checked the certificates' validity periods and they seemed OK. I spoke to the networking team and they confirmed the certificates on the F5 were also A-OK.

I dug deeper into the certificate validity message in Chrome and found this:

{{< fluid_imgs
  "pure-u-1-1|/images/certificate-san-missing-1.png"
>}}

I looked around online and found that starting with [Chrome v58](https://www.chromestatus.com/feature/4981025180483584) and Firefox v48 ([only source I could find](https://textslashplain.com/2017/03/10/chrome-deprecates-subject-cn-matching/)), support for SSL certificates without Subject Alternative Names had been deprecated.

This is very interesting! Why would this issue happen to this environment, when I'm almost certain that SAN attributes are included as part of the [VMware doco](http://pubs.vmware.com/vcd-810/index.jsp#com.vmware.vcloud.install.doc_810/GUID-89437328-EE0A-40D3-A939-EB8DD70DC1E3.html). In fact, I'm definitely certain it's there...

```
keytool 
   -keystore certificates.ks
   -alias consoleproxy 
   -storepass passwd
   -keypass passwd
   -storetype JCEKS
   -genkeypair
   -keyalg RSA
   -keysize 2048
   -validity 365 
   -dname "CN=vcd2.example.com, OU=Engineering, O=Example Corp, L=Palo Alto S=California C=US" 
   -ext "san=dns:vcd2.example.com,dns:vcd2,ip:10.100.101.10"
```

Yup, there it is (last line of the above code keytool options).

The linked [VMware doco](http://pubs.vmware.com/vcd-810/index.jsp#com.vmware.vcloud.install.doc_810/GUID-89437328-EE0A-40D3-A939-EB8DD70DC1E3.html) will step you through generating a keypair in the form of a self-signed certificate and private key into a keystore you specify (one will be created if it does not already exist). The SAN attribute specified in the example above will go into this self-signed certificate. However, if you attempt to create a CSR from this self-signed certificate using the instructions from VMware, you will be left with a CSR with no SAN attributes.

You can check the CSR yourself by running:

```
openssl req -in {csr-file} -noout -text
```

You'll see that there are no Subject Alternative Names specified. Without knowing this the first time around, I submitted this newly generated CSR to my internal Microsoft CA. While the certificate was issued successfully, none of the SAN attributes had been included.

This is due to VMware leaving a very important switch off the CSR generation command to make sure that SAN attributes are included in the CSR.

To get the SAN attributes included in the CSR, you'll need to modify VMware's example from the doco. Instead of running this command to generate the CSR from the self-signed cert:

```
keytool -keystore certificates.ks -storetype JCEKS -storepass {password} -certreq -alias http -file http.csr
```

You'll want to add your SAN attributes to the keytool certreq command so it looks like this:

```
keytool -keystore certificates.ks -storetype JCEKS -storepass {password} -certreq -alias http -file http.csr -ext SAN=dns:vcd2.example.com,dns:vcd2,ip:10.100.101.10
```

Huge credit to Eric Lawrence from [textslashplain](https://textslashplain.com/) for sending me down the rabbit hole. Even bigger credit to StackOverflow user [MrPatol](http://mrpatol/) for basically spelling out the fix (original SO thread [here](https://stackoverflow.com/questions/8744607/how-to-add-subject-alernative-name-to-ssl-certs)).