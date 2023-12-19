FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye

RUN npm install -g npm@10.2.4

# Clean up old resources
RUN rm -Rf /current/aws 

RUN mkdir -p /current/aws
WORKDIR /current/aws

# Install dependencies
RUN apt-get update -y && apt-get install -y zip unzip sudo pip

# Install aws cli
# See https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/getting-started-install.html
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN sudo ./aws/install --update

# Install aws sam cli
# See https://docs.aws.amazon.com/ja_jp/serverless-application-model/latest/developerguide/install-sam-cli.html
RUN pip install --upgrade aws-sam-cli

RUN npm install -g aws-cdk