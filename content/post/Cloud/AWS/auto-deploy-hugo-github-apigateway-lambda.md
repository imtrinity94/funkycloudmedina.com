---
title: "Deploy a Hugo website from GitHub to S3 using API Gateway and Lambda"
tags: ["AWS", "Hugo", "GitHub", "Lambda", "S3", "Blog", "Python", "API Gateway"]
date: 2018-10-17
draft: false
toc: true
---
If you followed my previous posts on auto deploying a Hugo site from GitHub to S3 ([Part 1](/2018/02/auto-deploy-a-hugo-website-from-github-to-s3---part-1/), [Part 2](/2018/02/auto-deploy-a-hugo-website-from-github-to-s3---part-2/)) you may have noticed that GitHub is deprecating the GitHub Services Integration mechanism. This is critical to the auto deployment function so we'll need an alternative. To add to my woes, I've found that the Node deployment package and all of its dependencies involves more maintenance than it deserves. I also noticed that the original Node package was only *adding* to the target S3 bucket, not performing a sync or equivalent.

What I hope to do in this post is show you how to create a new solution using AWS' Lambda and API Gateway services so it can deploy a Hugo static site to AWS S3 from GitHub using nothing but Lambda-accessible Python libraries. Yes, I'm so against ongoing maintenance that I'd rather learn Python and rewrite my JavaScript function so that I don't have to update a dozen Node packages and develop some ridiculous CI/CD pipeline just to manage static site deployments.

# Objectives

Here's what I want to achieve:

1. Download the latest release of Hugo.
1. Download the latest version of my website's Hugo source from GitHub.
1. Run `hugo` to build the static `public` pages from the source material.
1. Remove any existing material from the target S3 bucket.
1. Copy the generated static website to the target S3 bucket.
1. All of this triggered by a GitHub Webhook whenever I push to the repo.

What are we going to need? Well, we're going to need at least one Lambda function. And an API Gateway to receive the Webhook from GitHub which can then invoke the Lambda function. Unfortunately, GitHub has a 10 second timeout for a response from any triggered Webhook and our new Python script to deploy our site runs way over 10 seconds so GitHub will never mark our Webhook as "successful" when it's run. To get around this, we'll need another Lambda function between our API Gateway and our deploying Lambda function so we can perform an 'async' operation that will invoke our site deploying Lambda function. Our new flow of actions:

GitHub Webhook -> API Gateway -> Lambda: Async invoke site deployer -> Lambda: Deploy website

Here's what we need to build (in order):

1. Lambda - Python code to perform steps 1-5 above.
1. Lambda - Python code to asyncronously invoke the above Lambda function.
1. API Gateway - API's to receive a POST from GitHub.

## Create the new AWS Lambda functions

I won't rehash too much of the Lambda creation process (see [my original post](/2018/02/auto-deploy-a-hugo-website-from-github-to-s3---part-2/)) but take care, there will be some changes.

### Lambda: Deploy website

For this Lambda function you need to:

- Set the __Runtime__ to "Python 2.7"
- Set the __Code entry type__ to "Edit code inline"
- Set the __Handler__ value to "deploy.lambda_handler"
- Set the __Timeout__ value to 30 seconds.

So go ahead and create the new Lambda function (with the tweaks above). Create the following environment variables too:

- GITHUB_ACCOUNT - Name of the GitHub account the repo is stored under. Typically your username.
- GITHUB_REPO - Name of the GitHub repo.
- TARGET_BUCKET - Name of the target S3 bucket. **Not** the URL.

You'll also want your Lambda function to have the following IAM policy, in addition to the default that is provided when you create a Lambda function:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:ListBucket",
                "s3:DeleteObject"
            ],
            "Resource": [
                "arn:aws:s3:::{bucket-name}",
                "arn:aws:s3:::{bucket-name}/*"
            ]
        }
    ]
}
```

This is almost identical to the IAM policy from my previous posts, but I've added the __s3:DeleteObject__ action to address Objective 4.

#### Objective 1: Download the latest version of a website's Hugo source

First up let's grab the source of my website from GitHub. We need to grab the ZIP file that contains the master branch. Luckily for us the file is available at a static URL so I'll just hardcode it for now. The URL is ```https://github.com/ + account + '/' + repo + '/archive/master.zip``` which I'll build dynamically in the Python function (you'll see). We also need to unpack the zip into the `/tmp` directory. The resulting path will be `/tmp/reponame-master`:

{{< highlight python "linenos=inline" >}}
def downloadSite(account, repo):
    logger.info("Downloading master zip of " + repo + " from GitHub")
    zip = urllib.urlretrieve('https://github.com/' + account + '/' + repo + '/archive/master.zip', '/tmp/master.zip')
    siteZip = "/tmp/master.zip"

    with ZipFile(siteZip, 'r') as zip:
        logger.info("Extracting site files now")
        zip.extractall("/tmp")
        logger.info("Extraction complete!")
{{< / highlight >}}

You'll notice that this function takes 2 inputs; 'account' is the GitHub account that hosts the repo, and 'repo' is the name of the repo. It uses these 2 values to build the URL.

#### Objective 2: Downloading the latest version of Hugo

OK let's tackle Objective 2: Downloading the latest version of Hugo. Checking out Hugo's releases page on GitHub, you can see the file name changes for each release, so you can't hardcode a download URL:

![lambda-config-hugo-releases](/images/hugo-deployer-api-gateway/lambda-code-1.png)

However, GitHub have an API that you can use to navigate GitHub projects programmatically. The releases page for each project can give you an array of those "Assets" that you can iterate through. Alright, now I need to use a Regular Expression to find the Linux 64bit build, regardless of version number. I also want to grab the tarball, not the deb. I've highlighted the important bits here:

{{< highlight python "linenos=inline, hl_lines=3 8 9 11" >}}
def downloadHugo(repo):
    logger.info("Downloading latest Hugo")
    pattern = re.compile("hugo\\_\\d.+\\_Linux-64bit.tar.gz") # Setting the RegEx to grab what we need from the Assets array
    response = requests.get("https://api.github.com/repos/gohugoio/hugo/releases/latest") # GitHub API for the releases
    release = response.json()
    assets = release["assets"]
    for asset in assets:
        if pattern.match(asset["name"]):
            downloadUrl = asset["browser_download_url"] # Grab the download URL for the Asset
            logger.info("Value of downloadUrl: " + downloadUrl)
    urllib.urlretrieve(downloadUrl, '/tmp/hugo.tar.gz') # Download the file
    logger.info("Hugo download complete")
    logger.info("Extracting Hugo")
    tar = tarfile.open("/tmp/hugo.tar.gz")
    tar.extractall("/tmp/" + repo + "-master")
    tar.close()
{{< / highlight >}}

You can see I'm grabbing the latest releases page and parsing it as a JSON object. I'm then looping through the "assets" list looking at each asset's name for a RegEx match. If a match is found the downloadUrl variable is set with the "browser_download_url" value from the asset. This function also takes the 'repo' name as an input to figure out the right directory to place the Hugo tar into: `/tmp/reponame-master/`. We're putting it here so that when we're ready to run Hugo, it's already in the same folder as the Hugo site config file.

#### Objective 3: Execute Hugo to generate the website

We've now got a directory that contains the website source and the Hugo binary. Let's work on executing it:

{{< highlight python "linenos=inline, hl_lines=3-4 6 7" >}}
def buildSite(repo):
    logger.info("Building site")
    os.chdir("/tmp/" + repo + "-master")
    os.system('./hugo')
    logger.info("Site built with Hugo")
    buildDir = os.getcwd() + "/public"
    return buildDir
{{< / highlight >}}

Again, we're taking the repo name in as an input to build the directory. This function switches to the same directory that contains Hugo and executes it. The last two lines concatenates a path for the generated static site location: `/tmp/reponame-master/public`. We'll need this later for another function that will copy that directory to S3.

#### Objectives 4 & 5: Empty target bucket and copy new site to S3

You're probably wondering why I chose to empty the target bucket then copy the data over. Well, the AWS CLI allows you to 'sync' a local directory to S3 but it's not available inside Lambda's execution space, and the boto3 Python library does not implement the sync functionality. The best workaround I could come up with for a site as 'busy' as mine was to just empty the target bucket and rewrite the contents whenever I update the site.

Emptying the bucket was easy enough but I had to ['borrow' some code](https://www.developerfiles.com/upload-files-to-s3-with-python-keeping-the-original-folder-structure/) to get the local->S3 recursive copy done.

{{< highlight python "linenos=inline, hl_lines=8-13 " >}}
def syncS3(path, s3Bucket):
    logger.info("Copying to S3")
    session = boto3.Session()
    s3 = session.resource('s3')
    bucket = s3.Bucket(s3Bucket)
    logger.info("Emptying bucket first")
    bucket.objects.all().delete()
    for subdir, dirs, files in os.walk(path):
        for file in files:
            full_path = os.path.join(subdir, file)
            with open(full_path, 'rb') as data:
                bucket.put_object(Key=full_path[len(path)+1:], Body=data, ContentType='text/html')
    logger.info("Generated site uploaded to S3 successfully.")
{{< / highlight >}}

Two inputs are required for this function, the source path that I want to copy (returned from the __buildSite__ function) and the target S3 bucket. Lines 7-12 show the bucket getting emptied and all files and folders in the `/tmp/reponame-master/public` directory being copied to the S3 bucket.

#### Tie it all together

Lambda needs a main function to call commonly referred to as the lambda_handler. It's the 'master' of the other functions. It's here that I'm going to grab the GitHub account and repo values from the Lambda environment variables too (from my older posts). It's also here where I'll feed these values into the functions we've written.

{{< highlight python "linenos=inline, hl_lines=8-13 " >}}
def lambda_handler(event, context):
    sourceRepo = os.environ['GITHUB_REPO']
    gitAccount = os.environ['GITHUB_ACCOUNT']
    targetBucket = os.environ['TARGET_BUCKET']

    downloadSite(gitAccount, sourceRepo)
    downloadHugo(sourceRepo)
    buildDir = buildSite(sourceRepo)
    syncS3(buildDir, targetBucket)

    response = {
        'statusCode': 200,
        'body': "lambda_handler executed"
    }

    return response
{{< / highlight >}}

You can see at the end of my 'lambda_handler' I've added a response object consisting of a HTTP code. As is, this function isn't performing any error handling. The status code and body of the response is where you'd place any errors received during execution, but that's something for another post.

If you jump ahead to [the code](#tldr-the-code) at the end of the post, you'll see the full Python script in all its glory along with my AWS Lambda function configuration to have it execute in a decent time frame.

### Lambda: Asyncronously invoke another Lambda function

OK we've got a Lambda function that can deploy our website from the source, we now need a Lambda function to execute our first Lambda function (cue memes).

Go ahead and create a new Lambda function but this time, let's use __Python 3.6__ as the __Runtime__. Set a new environment variable called "LAMBDA_NAME" and in the value field enter the name of the "site deploying" Lambda function you created earlier. Let's leave the default __Handler__ name, and skip to the code:

{{< highlight python "linenos=inline, hl_lines=1-2 4 6 7-9 12-15" >}}
import boto3
import os

def lambda_handler(event, context):

    client = boto3.client('lambda')
    response = client.invoke(
        FunctionName=os.environ['LAMBDA_NAME'],
        InvocationType='Event'
    )

    return {
        "statusCode": 200,
        "body": 'Hugo Site Builder Executed'
    }
{{< / highlight >}}

Let's break this code down:\
Line 1-2 we're importing the boto3 and os libraries.\
Line 4 we're declaring the new __lambda_handler__ function.
Line 6 we are declaring a new boto3 client for Lambda.\
Line 7-9 we're using this new client to invoke a Lambda function using the environment variable "LAMBDA_NAME" as the name of the function to invoke. We've also specified that the Invocation type is "Event" which means that we will __not__ wait for a response.\
Line 12-15 we're returning a JSON object that contains a HTTP status code (200) and a message in the body field of "Hugo Site Builder Executed". This message will be returned by our function to API Gateway.\

We also need to provide this new Lambda function with privileges to execute other Lambda functions. Jump into the IAM console, open __Roles__ and create a new Role. When asked what service will use the role select "Lambda" and click Next. Search for "AWSLambdaRole". This policy allows an entity to execute any of your Lambda functions. Check the box next to it and click Next. Provide a name for the new role. I've called mine "custom_LambdaExecutor". Click "Create Role".

Go back to the "executing" function we've just made and set the "Execution Role" to your new Role and save the Lambda function. You've now got a Lambda function that can invoke another Lambda function.

## Create the API Gateway

We've created our Lambda functions, but we haven't configured a trigger mechanism between GitHub and AWS. We're going to use an [API Gateway](https://aws.amazon.com/api-gateway/).

In the AWS Console, open the Services drop down and search for __API Gateway__. If you haven't got any API's defined yet, click __Get Started__ in the middle of the page. It'll walk you through your first API. If you have already defined APIs, you'll be presented with the API management page and you can create a new API there.

From the new API creation wizard, select the __New API__ radio button and enter a name for your new API. I've just called mine 'deploy-hugo-site'. Set your API to __Regional__ for the Endpoint Type option. Click __Create API__.

You'll be taken to the __Resources__ section of your new API. This is where we define the HTTP path and methods that we want to use.

### Create a new method

With the root level resource selected, click __Actions__ and select __Create Method__. It'll show a drop down menu below the 'root level' of the API. Select 'POST' and click the tick button. Configure the new method with the following details and be sure to use the name of your "executing" function (the one that triggers the "deployer"):

![create-new-api-1](/images/hugo-deployer-api-gateway/create-api-method-1.png)

Go ahead and click __Save__.

### Deploy the API

We need to __Deploy__ our new API into something called a __Stage__. A Stage is simply a representation of development of our API. It provides a way to define different 'stages' of API development lifecycle; i.e Prod, Dev, Test etc. __Deploying__ our API makes it available to those with the appropriate entitlements to use it.

In the __Resources__ section of your API, select the root level of your API and click __Actions__ then __Deploy API__. Fill in the details as below:

![deploy-new-api](/images/hugo-deployer-api-gateway/deploy-api.png)

Click __Deploy__ once you're done. You can now change global settings and limits for your new Stage so that any API deployed to it will inherit these settings. We won't need to for this deployment.

Click __Stages__ on the left hand side and you'll see the new Stage that was created. Expand the stage to see the root level and the method immediately below it:

![deploy-new-api-2](/images/hugo-deployer-api-gateway/deploy-api-2.png)

If you select the stage or the method you'll be shown the URL that you can POST against. This is the URL we'll use in GitHub. Copy it to your clipboard or notepad.

## Configure the GitHub Webhook

GitHub have a preferred alternative to their Services Integration mechanism which is to use GitHub Webhooks. This allows us to make a HTTP POST to *any* web service whenever a GitHub action occurs. As you can imagine this is way more flexible than the GitHub Services feature. We can integrate with any web service, not just what GitHub supports.

Login to your GitHub account and open up your repo that contains your Hugo website source. Go to the Settings tab (along the top) and select Webhooks on the left hand side. Click __Add Webhook__ and enter the URL of your new API and set the content type to __application/json__. Here's how I've configured mine:

![github-webhook-1](/images/hugo-deployer-api-gateway/github-webhook-1.png)

Click __Add Webhook__.

Refresh the Webhooks page and you should see a green tick next to your webhook:

![github-webhook-2](/images/hugo-deployer-api-gateway/github-webhook-2.png)

## tldr - The code

### Deployer Script

Behold:

{{< highlight python "linenos=inline" >}}
import logging
import os
from zipfile import ZipFile
import urllib
from botocore.vendored import requests
import json
import tarfile
import re
import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def downloadSite(account, repo):
    logger.info("Downloading master zip of " + repo + " from GitHub")
    zip = urllib.urlretrieve('https://github.com/' + account + '/' + repo + '/archive/master.zip', '/tmp/master.zip')
    siteZip = "/tmp/master.zip"

    with ZipFile(siteZip, 'r') as zip:
        logger.info("Extracting site files now")
        zip.extractall("/tmp")
        logger.info("Extraction complete!")

def downloadHugo(repo):
    logger.info("Downloading latest Hugo")
    pattern = re.compile("hugo\\_\\d.+\\_Linux-64bit.tar.gz")
    response = requests.get("https://api.github.com/repos/gohugoio/hugo/releases/latest")
    release = response.json()
    assets = release["assets"]
    for asset in assets:
        if pattern.match(asset["name"]):
            downloadUrl = asset["browser_download_url"]
            logger.info("Value of downloadUrl: " + downloadUrl)
    urllib.urlretrieve(downloadUrl, '/tmp/hugo.tar.gz')
    logger.info("Hugo download complete")
    logger.info("Extracting Hugo")
    tar = tarfile.open("/tmp/hugo.tar.gz")
    tar.extractall("/tmp/" + repo + "-master")
    tar.close()

def buildSite(repo):
    logger.info("Building site")
    os.chdir("/tmp/" + repo + "-master")
    os.system('./hugo')
    logger.info("Site built with Hugo")
    buildDir = os.getcwd() + "/public"
    return buildDir

def syncS3(path, s3Bucket):
    logger.info("Copying to S3")
    session = boto3.Session()
    s3 = session.resource('s3')
    bucket = s3.Bucket(s3Bucket)
    logger.info("Emptying bucket first")
    bucket.objects.all().delete()
    for subdir, dirs, files in os.walk(path):
        for file in files:
            full_path = os.path.join(subdir, file)
            with open(full_path, 'rb') as data:
                bucket.put_object(Key=full_path[len(path)+1:], Body=data, ContentType='text/html')
    logger.info("Generated site uploaded to S3 successfully.")

def lambda_handler(event, context):
    sourceRepo = os.environ['GITHUB_REPO']
    gitAccount = os.environ['GITHUB_ACCOUNT']
    targetBucket = os.environ['TARGET_BUCKET']

    downloadSite(gitAccount, sourceRepo)
    downloadHugo(sourceRepo)
    buildDir = buildSite(sourceRepo)
    syncS3(buildDir, targetBucket)

    response = {
        'statusCode': 200,
        'body': "Site deployed successfully"
    }

    return response
{{< / highlight >}}

I've got my deploying Lambda execution Memory configuration set to 320MB. This gives me a total execution time of around 20 seconds. If I increase this to the maximum, I can get it down to 15 seconds. For my use case this duration isn't a problem as most of the time is spent downloading Hugo and the repo master ZIP file. What I'm most focused on is the time between emptying the bucket and syncing all new data, I don't want visitors to hit a page not found error on my site's landing page.

My function's timeout is at 30 seconds because I know that this site build shouldn't take that long. If my site blows up in size then I may revisit this timeout if the deployment is genuinely taking longer.

### Executor Lambda

Not as impressive, but does the job:

{{< highlight python "linenos=inline" >}}
import boto3
import os

def lambda_handler(event, context):

    client = boto3.client('lambda')
    response = client.invoke(
        FunctionName=os.environ['LAMBDA_NAME'],
        InvocationType='Event'
    )

    return {
        "statusCode": 200,
        "body": 'Hugo Site Builder Executed'
    }
{{< / highlight >}}

------

I've taken my Hugo site deploying function from 8.6MB compressed written in Node and with plenty of dependencies, to a couple of lightweight Python functions that don't even make 2.0KB. I realise this solution does not address adding an API key and authorising requests to the service but I'm hoping to figure that out and do another post. Still, this isn't bad considering this post was deployed with the new solution ;)

If you have any questions or suggestions I'd love to hear them.