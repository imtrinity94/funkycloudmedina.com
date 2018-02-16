---
title: "Using Docker as an adhoc NodeJS package manager"
tags: ["AWS", "Lambda", "Docker", "NodeJS"]
date: 2018-02-16
draft: false
---
During my [GitHub -> Lambda -> S3 series](/2018/02/auto-deploy-a-hugo-website-from-github-to-s3---part-1/) I needed to download and install NodeJS modules into my project's working directory. I didn't really want to install NodeJS and NPM on my Mac as my machine is a daily driver (SysAdmin/Ops) and not really a front or backend dev machine.

I could always use a virtual machine but that's too resource intensive just to download some NPM modules. What's smaller than a VM?

---

Containers! They're neat little things and I love looking for a good reason to use them. For my use case, I needed to run a container that could install the NodeJS and NPM binaries, install some NPM modules to a mounted directory and then stop the container.

On my Mac I had a Lambda package working directory - a normal folder where my JavaScript file and node modules were going to live. With Docker already installed and running, I started an interactive ubuntu container and mounted my project's directory into a directory in the container called "working":

```bash
docker run -v /Users/stell/Projects/hugo-site-deployer/node:/working -it ubuntu
```

From the container terminal I was able to install NodeJS and NPM:

```bash
sudo apt-get install nodejs && sudo apt-get install npm
```

After changing to the /working directory and installing a few npm modules (npm install) I had a folder with all of my required modules without touching my main OS. As I've written in my auto deployment series you can then zip the contents of your working folder and send it to Lambda.

You could use this process for almost anything that allows stateless modules to be stored in a folder and moved around (I'm pretty sure Python supports a similar method).