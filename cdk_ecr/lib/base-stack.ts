import { CfnResource, Stack, StackProps } from "aws-cdk-lib";
import { CfnInternetGateway, CfnSubnet, CfnVPC, CfnVPCGatewayAttachment } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

class Context {
  project: string;
  env: string;

  constructor(stack: Stack) {
    this.project = stack.node.tryGetContext("project");
    this.env = stack.node.tryGetContext("env");
  }

  getResourceName(resource: string): string {
    return `${this.project}-${this.env}-${resource}`;
  }
}

class Resource<T extends CfnResource> {
  raw: T;
  resourceName: string;

  constructor(resource: T, resourceName: string) {
    this.raw = resource;
    this.resourceName = resourceName;
  }
}

type AvailabilityZone = "ap-northeast-1a" | "ap-northeast-1c";

export class BaseStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const context = new Context(this);

    const vpc = this.createVpc(context, "vpc");
    const subnets = [
      this.createSubnet(
        context,
        vpc.raw,
        "10.0.11.0/24",
        "ap-northeast-1a",
        "subnet-public-1a"
      ),
      this.createSubnet(
        context,
        vpc.raw,
        "10.0.12.0/24",
        "ap-northeast-1c",
        "subnet-public-1c"
      ),
      this.createSubnet(
        context,
        vpc.raw,
        "10.0.21.0/24",
        "ap-northeast-1a",
        "subnet-app-1a"
      ),
      this.createSubnet(
        context,
        vpc.raw,
        "10.0.22.0/24",
        "ap-northeast-1c",
        "subnet-app-1c"
      ),
      this.createSubnet(
        context,
        vpc.raw,
        "10.0.31.0/24",
        "ap-northeast-1a",
        "subnet-private-1a"
      ),
      this.createSubnet(
        context,
        vpc.raw,
        "10.0.32.0/24",
        "ap-northeast-1c",
        "subnet-private-1c"
      ),
    ];

    const igw = this.createInternetGateway(context, vpc.raw, "igw");
  }

  private createVpc(context: Context, resourceName: string): Resource<CfnVPC> {
    const vpc = new CfnVPC(this, resourceName, {
      cidrBlock: "10.0.0.0/16",
      tags: [{ key: "Name", value: context.getResourceName(resourceName) }],
    });
    return new Resource(vpc, context.getResourceName(resourceName));
  }

  private createSubnet(
    context: Context,
    vpc: CfnVPC,
    cidrBlock: string,
    availabilityZone: AvailabilityZone,
    resourceName: string
  ): Resource<CfnSubnet> {
    const subnet = new CfnSubnet(this, resourceName, {
      vpcId: vpc.ref,
      cidrBlock: cidrBlock,
      availabilityZone: availabilityZone,
      tags: [{ key: "Name", value: context.getResourceName(resourceName) }],
    });
    return new Resource(subnet, context.getResourceName(resourceName));
  }

  private createInternetGateway(context:Context, vpc: CfnVPC, resourceName: string): Resource<CfnInternetGateway> {
    const internetGateway = new CfnInternetGateway(this, resourceName, {
      tags: [{ key: "Name", value: context.getResourceName(resourceName) }],
    });

    new CfnVPCGatewayAttachment(this, "vpc-gateway-attachment", {
      vpcId: vpc.ref,
      internetGatewayId: internetGateway.ref,
    });

    return new Resource(internetGateway, context.getResourceName(resourceName));
  }
}
