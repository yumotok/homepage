import { CdkStack } from '../lib/cdk-stack';
import { App } from 'aws-cdk-lib';

const app = new App();
new CdkStack(app, 'CdkStack', {
});