---
title: "Auto deploy a Hugo website from GitHub to S3 - Part 2"
tags: ["AWS", "Hugo", "GitHub", "Lambda", "S3", "Blog"]
date: 2018-02-20
---
This post is part of a series. You're reading Part 2.

+ [Auto deploy a Hugo website from GitHub to S3 - Part 1](/2018/02/auto-deploy-a-hugo-website-from-github-to-s3---part-1/)

-----

# Preparing for the AWS Lambda function

Now that GitHub notifies AWS of changes, we need to create the "doing" part of our project. We're going to use AWS' Lambda service to perform the work. Lambda will execute the function everytime a notification is published to the SNS topic.

Lambda will need an IAM role with an attached policy to perform actions against a target S3 bucket. Let's start by creating the IAM policy.

## Lambda IAM policy

1. In the AWS console open the IAM dashboard.
2. Click **Policies** on the left.
3. Click **Create policy** along the top.
4. In the policy editor, select the **JSON** tab.
5. Enter the following for the new policy:

        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "VisualEditor0",
                    "Effect": "Allow",
                    "Action": "s3:PutObject",
                    "Resource": "arn:aws:s3:::{your-s3-bucket-name-here}/*"
                }
            ]
        }
Note: Where it says "your-s3-bucket-name-here" just put the bucket name **not** the bucket URL.
6. Click **Review policy**.
7. Give your policy a name and description. Write the name down for the next step.
8. Click **Create policy**.

We've justed created an IAM policy that **allows** (the "Effect") any attached role or user to **Put** (the "Action") objects into an **S3 bucket** (the "Resource").

## Lambda IAM role

An AWS IAM role is effectively an identity that each AWS service can assume in order to perform work in the AWS ecosystem. You can read more about IAM roles [here](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html).

For our requirements, we'll create an IAM role for a specific Lambda function.

1. In the AWS console open the IAM dashboard.
2. Click **Roles** on the left.
3. Click **Create role** along the top.
4. Leave the **AWS Service** entity selected, and click on **Lambda** underneath it.
5. Click **Next: Permissions**.
6. Search and select the IAM policy you created in the previous step.
7. Search for and select the **AWSLambdaBasicExecutionRole** policy.
7. Select the checkbox next to the policy and click **Next: Review**.
8. Give the role a name and description. Write the name down for the next step.
9. Click **Create Role**.

We've now created an IAM role that has the ability to put objects on S3 and by selecting the **AWSLambdaBasicExecutionRole** policy, we can also write logs to CloudWatch to monitor our Lambda executions.

# Create the Lambda function

Now we can actually create the function.

1. In the AWS console open the Lambda dashboard.
2. Click the **Create function** button.
3. Leave the **Author from scratch** option selected, and begin filling out the fields:
    4. **Name** is whatever name you want to give the Lambda function.
    5. Set **Runtime** to **Node.js 6.10**.
    6. In the **Role** dropdown, select the **Choose an existing role**.
    7. In the **Existing role** dropdwon, select the role you created in the previous step.
8. Click the **Create function** button.

You'll now be presented with the Lambda function designer. This is where we will define the triggers for the function's execution, environment variables that will be passed in and the code that will be executed. Unfortunately, we have no lambda packages to upload or code to write...yet.

Let's quickly add our environment variables to the Lambda function.

1. In the function editor, scroll down to the **Environment variables** section.
2. Enter new environment variables with the following key names:

                GITHUB_ACCOUNT
                GITHUB_REPO
                TARGET_BUCKET

3. For each environment variable, enter the value that matches your deployment. For me, I had the following:

```
| Key            | Value                    |
| -------------- | ------------------------ |
| GITHUB_ACCOUNT | TheNewStellW             |
| GITHUB_REPO    | funkycloudmedina.com     |
| TARGET_BUCKET  | www.funkycloudmedina.com |
```

These environment variables will be passed into the function at execution. The reason I've done it this way is to make the function site agnostic and something other people can use.

# Code

Initially I thought it was going to be easier writing this function in Python but I quickly realised that was going to take longer than it needed. I already had an understanding of Javascript thanks to vRealize Orchestrator. How hard could Node.js be? ;)

So, I needed the function to do a few things in one execution:

1. Clone the latest copy of the 'master' branch from my blog's GitHub repo.
2. Run Hugo against the source and generate the website files.
3. Copy all generated files and directories to my S3 bucket.

My first line of thinking was "how will I clone my Git repo?". Initially I was digging online to find a way to execute "git pull" or "git clone" in a Node.js environment within Lambda. I started digging for Git modules for Node.js but couldn't find anything that was a reasonable size for a deployment package (node-git was OK, but it and its dependencies were too large). I dug around for a bit and found [this blog post](http://writebadcode.com/post/hugo-blogging-about-hugo/) by "writebadcode" (apologies, I can't find his/her name or online handle). In it, he/she covers the same roadblocks I had and managed to work through them. I recommend having a read!

To summarise, "writebadcode" downloaded a **zip** of the master branch and unzipped it locally in the Lambda execution. Fantastic! I can't believe I didnt think of that. The download is done using a simple HTTP request module in Node which is a very lightweight module.

Righto, what do I need to get this working? I need to install Node.js and I'll need to create a working directory for my Node.js project first. You can find Node installation steps here.

## NPM modules

Once your project directory has been created, open your terminal and change to your project directory. Install the following NPM modules using **npm install {module-name}**:

+ request
+ fs
+ path
+ child_process
+ mime

These modules will now be placed in a folder called "npm_modules" in your working directory. If you want to know how I did it with relative ease, check out [my post on a containerised NPM installer](/2018/02/using-docker-as-an-adhoc-nodejs-package-manager/).

## Hugo binary

You'll need to package the compiled Hugo binary with the Lambda package. I grabbed the latest tar from the project's release page on GitHub:
https://github.com/gohugoio/hugo/releases

I downloaded and unpacked Linux 64-bit tar.gz archive into my working directory.

## Code block

I've dumped my Javascript file into a GitHub gist below:

<script src="https://gist.github.com/TheNewStellW/289525ff7c6be217657429b871e0b38a.js"></script>

For the record I claim no ownership over any of this code. 99% of it was lifted from "writebadcode" but there were some mime module methods that needed a fix up, along with the addition of environment variables instead of hard coded bucket and repo. Whatever I've added is free for use and modification.

# Uploading

Before you can upload your function you'll need to create a deployment package.

## Packaging

To package your Lambda function, select all of the files **inside** your working diretory and zip them. This zip should now contain your Javascript file and the "npm_modules" folder created earlier.

## Configuring Lambda

Back in the Lambda console for your function it's time to upload your package and configure Lambda to execute it.

1. Scroll down to the **Function code** section of the Lambda function editor.
2. Select **Upload a .ZIP file** from the **Code entry type** drop down box.
3. Use the Upload button that appears to select your new ZIP file.
4. In the **Handler** text box, you'll need to specify the name of the function inside the Javascript file that needs to be executed. AWS expects it to be {file-name}.{function-name}. The file name should not have the file extension.
5. Save the Function. You're now ready to test!

## Testing Lambda

Click the **Test** button at the top of the Function editor. You'll probably need to create a "Test Event". A Test Event is a collection of variables that are fed into the function during a test execution. It's perfect if you have a function that takes input, performs a task and returns a value. In this scenario we don't require an input but we can't test without a Test Event. So just create it with fake values and a boring name like "Test Event".

Monitor the output at the top of the function page. Hopefully you get a success message! If the function did not execute in the expected time of 10 or 15 seconds, feel free to increase the timeout value to 60 seconds or more. This depends on the size of the Hugo site you are generating and uploading to S3.

# Review

You should now have an end to end workflow to automatically deploy your Hugo website from GitHub to S3 using Lambda. If you have any questions or suggestions please feel free to leave a comment or reach out to me on Twitter.