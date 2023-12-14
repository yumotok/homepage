#!/usr/bin/env node
import 'source-map-support/register';
import { ECRStack } from '../lib/ecr-stack';
import { VpcStack } from '../lib/vpc-stack';
import { App } from 'aws-cdk-lib';

const app = new App();
new ECRStack(app, 'ECRStack', {});
new VpcStack(app, 'VpcStack', {});