#!/usr/bin/env node
import 'source-map-support/register';
import { ECRStack } from '../lib/ecr-stack';
import { BaseStack } from '../lib/base-stack';
import { App } from 'aws-cdk-lib';

const app = new App();
new ECRStack(app, 'ECRStack', {});
new BaseStack(app, 'BaseStack', {});