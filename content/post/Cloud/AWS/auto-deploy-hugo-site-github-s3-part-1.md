---
title: "Auto deploy a Hugo website from GitHub to S3 - Part 1"
tags: ["AWS", "Hugo", "GitHub", "Lambda", "S3", "Blog"]
date: 2018-02-12
draft: false
---
This post is part 1 of a 2 part series. When I've written and posted the second part I'll link to it here.

# Introduction

For those who don't know what [Hugo](https://gohugo.io/) is, it's a static website generator. Its source material is a Hugo template with your content in Markdown. I've used it for a while, in fact this blog is generated using Hugo. Hugo can give you an entire site in HTML/CSS and any required Javascript that you can then place anywhere on the web.

While that sounds fantastic, I had to run Hugo on my local machine and copy the resulting website files to my S3 bucket that hosts this blog. That's just too manual for me and not cloudy enough.

I have my blog source material in a GitHub repo. Let's see if there's anything I can do with it.

Let's step out my current process of a blog post:

1. Write a blog post in Markdown.
2. Add file to Git, Commit the changes and push to my remote repo in GitHub.
3. Run **Hugo** locally to generate a new copy of my blog in HTML.
4. Copy site files to my S3 bucket (drag and drop - gross)

Enter [Lambda](https://aws.amazon.com/lambda/features/), [SNS](https://aws.amazon.com/sns/) topics and [GitHub service integrations](https://developer.GitHub.com/webhooks/)...

With these 3 services you can have your GitHub source pulled by Lambda, generate your site with Hugo and written to your S3 bucket everytime a commit is made to the GitHub repo.

There are plenty of tutorials out there that cover each component separately but none that can walk through the entire process (one definitely came close though). This post will cover the creation of the SNS topic and integration with GitHub.

I'm assuming you already have an AWS account and a GitHub account with a repo you'd like to deploy from.

# Configuring SNS and GitHub Integration

The first step is to get GitHub to notify AWS whenever there is a new commit. We'll need to create an SNS topic, an IAM user and a policy so GitHub can use this user to publish to the SNS topic.

## SNS Topic

1. Login to the AWS console
2. Open the SNS dashboard
3. Click **Create topic**
4. Give the topic a name and description.
5. Once created, note the ARN. You'll need it later.

## IAM policy for the GitHub user

1. In the AWS console open the IAM dashboard.
2. Click **Policies** on the left.
3. Click **Create policy** along the top.
4. In the policy editor, select the **JSON** tab.
5. Enter the following JSON snippet for the new policy:

        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": [
                        "sns:Publish"
                    ],
                    "Resource": [
                        "{your-SNS-topic-ARN-here}"
                    ],
                    "Effect": "Allow"
                }
            ]
        }

6. Click the **Review policy** button to continue.
7. Give this new policy a name and description.
8. Review the summary of privileges that the policy will provide.
9. Click **Create policy** when you are happy with it. Keep note of the policy name you'll need it in the next step.

The policy you just created will **Allow** (the "Effect") any attached IAM role or user to **Publish** (the "Action") to the ARN specified (the "Resource").

Next up is the IAM user.

## IAM user for GitHub integration

We'll need to create an IAM user for GitHub. The GitHub service integration needs an **Access Key** and a **Secret Key** to publish to the SNS topic.

1. In the AWS console open the IAM dashboard.
2. Click **Users** on the left.
3. Click **Add user** along the top.
4. Provide a new username and select **Programmatic access** for the AWS access type.
5. Click **Next: Permissions**.
6. Go to **Attach existing policies directly** and search for the new policy you created.
7. Select the checkbox next to the policy name.
8. Click **Next: Review**.
9. Review the user name, access type and policies given. Click **Create user**.
10. Keep a copy of the **Access key ID** and the **Secret access key** of the new user you've created. You'll need them for the next step.

## Enable GitHub integration to SNS

1. Login to GitHub and open your repository.
2. Click the **Settings** tab.
3. Go to **Integrations & services** on the left.
4. Using the **Add service** drop down, select **Amazon SNS**.
5. Provide the AWS information required for SNS publication:
  6. **Aws key** is the IAM user Access Key from the previous step.
  7. **Sns topic** is the full ARN of the SNS topic created earlier.
  8. **Sns region** is the AWS region identifier that your SNS topic was created in. To find your region's identifier [go here](https://docs.aws.amazon.com/general/latest/gr/rande.html).
  9. **Aws secret** is the IAM user Secret Key from the previous step.
10. Click **Add service**.

GitHub will now publish a notification to the SNS topic whenever a new commit is made.

---

That's it for Part 1. Stay tuned for Part 2!