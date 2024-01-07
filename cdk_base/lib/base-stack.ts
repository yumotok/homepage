import { CfnOutput, CfnResource, Stack, StackProps } from "aws-cdk-lib";
import {
  CfnEIP,
  CfnInternetGateway,
  CfnNatGateway,
  CfnNetworkAcl,
  CfnNetworkAclEntry,
  CfnRoute,
  CfnRouteTable,
  CfnSubnet,
  CfnSubnetNetworkAclAssociation,
  CfnSubnetRouteTableAssociation,
  CfnVPC,
  CfnVPCGatewayAttachment,
} from "aws-cdk-lib/aws-ec2";
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

    const tableBuilders = [
      new RouteTableBuilder({
        resourceName: "route-table-public",
        vpc: vpc,
        subnets: subnets.filter((s) => s.resourceName.includes("public")),
        igw: igw,
      }),
      new RouteTableBuilder({
        resourceName: "route-table-app",
        vpc: vpc,
        subnets: subnets.filter((s) => s.resourceName.includes("app")),
      }),
      new RouteTableBuilder({
        resourceName: "route-table-private",
        vpc: vpc,
        subnets: subnets.filter((s) => s.resourceName.includes("private")),
      }),
    ];

    // RouteTableを作成する
    tableBuilders.map((builder) =>
      builder.run(this, context)
    );

    const networkAclBuilders = [
      new NetworkAclBuilder({
        resourceName: "network-acl-public",
        vpc: vpc,
        subnetAssosiations: [
          {
            id: "network-acl-assosiation-public-subnet-1a",
            subnet: subnets.find((s) => s.resourceName.includes("subnet-public-1a"))
          },
          {
            id: "network-acl-assosiation-public-subnet-1c",
            subnet: subnets.find((s) => s.resourceName.includes("subnet-public-1c"))
          }
        ]
      }),
      new NetworkAclBuilder({
        resourceName: "network-acl-app",
        vpc: vpc,
        subnetAssosiations: [
          {
            id: "network-acl-assosiation-app-subnet-1a",
            subnet: subnets.find((s) => s.resourceName.includes("subnet-app-1a"))
          },
          {
            id: "network-acl-assosiation-app-subnet-1c",
            subnet: subnets.find((s) => s.resourceName.includes("subnet-app-1c"))
          }
        ]
      }),
      new NetworkAclBuilder({
        resourceName: "network-acl-private",
        vpc: vpc,
        subnetAssosiations: [
          {
            id: "network-acl-assosiation-private-subnet-1a",
            subnet: subnets.find((s) => s.resourceName.includes("subnet-private-1a"))
          },
          {
            id: "network-acl-assosiation-private-subnet-1c",
            subnet: subnets.find((s) => s.resourceName.includes("subnet-private-1c"))
          }
        ]
      }),
    ];

    // NetworkAclを作成する
    networkAclBuilders.forEach((builder) => {
      builder.run(this, context);
    });

    new CfnOutput(this, "vpc-id", {
      value: vpc.raw.ref,
      exportName: "vpc-id",
    });
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

  private createInternetGateway(
    context: Context,
    vpc: CfnVPC,
    resourceName: string
  ): Resource<CfnInternetGateway> {
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

class RouteTableBuilder {
  resourceName: string;
  vpc: Resource<CfnVPC>;
  subnets: Resource<CfnSubnet>[];
  igw?: Resource<CfnInternetGateway>;
  nat?: Resource<CfnNatGateway>;

  constructor(init: {
    resourceName: string;
    vpc: Resource<CfnVPC>;
    subnets: Resource<CfnSubnet>[];
    igw?: Resource<CfnInternetGateway>;
    nat?: Resource<CfnNatGateway>;
  }) {
    this.resourceName = init.resourceName;
    this.vpc = init.vpc;
    this.subnets = init.subnets;
    this.igw = init.igw;
    this.nat = init.nat;
  }

  run(scope: Construct, context: Context): Resource<CfnRouteTable> {
    const table = new CfnRouteTable(
      scope,
      context.getResourceName(this.resourceName),
      {
        vpcId: this.vpc.raw.ref,
        tags: [
          { key: "Name", value: context.getResourceName(this.resourceName) },
        ],
      }
    );

    if (this.igw != null) {
      new CfnRoute(
        scope,
        context.getResourceName(this.resourceName) + "-public-route",
        {
          routeTableId: table.ref,
          destinationCidrBlock: "0.0.0.0/0",
          gatewayId: this.igw.raw.ref,
        }
      );
    } else if (this.nat != null) {
      new CfnRoute(scope, context.getResourceName(this.resourceName) + "-nat", {
        routeTableId: table.ref,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: this.nat.raw.ref,
      });
    }

    this.subnets.forEach((subnet) => {
      new CfnSubnetRouteTableAssociation(
        scope,
        subnet.resourceName + "-route-table-association",
        {
          routeTableId: table.ref,
          subnetId: subnet.raw.ref,
        }
      );
    });

    return new Resource(table, context.getResourceName(this.resourceName));
  }
}

class NetworkAclBuilder {
  resourceName: string;
  vpc: Resource<CfnVPC>;
  subnetAssosiations: {
    id: string;
    subnet?: Resource<CfnSubnet>;
  }[];
  constructor(init: {
    resourceName: string;
    vpc: Resource<CfnVPC>;
    subnetAssosiations: {
      id: string;
      subnet?: Resource<CfnSubnet>;
    }[];
  }) {
    this.resourceName = init.resourceName;
    this.vpc = init.vpc;
    this.subnetAssosiations = init.subnetAssosiations;
  }

  run(scope: Construct, context: Context): Resource<CfnNetworkAcl> {
    const networkAcl = new CfnNetworkAcl(
      scope,
      context.getResourceName(this.resourceName),
      {
        vpcId: this.vpc.raw.ref,
        tags: [
          {
            key: "Name",
            value: context.getResourceName(this.resourceName),
          },
        ],
      }
    );

    // Outboundエントリ
    new CfnNetworkAclEntry(scope, context.getResourceName(this.resourceName)+"-oubound-entry", {
      networkAclId: networkAcl.ref,
      protocol: -1,
      ruleAction: "allow",
      ruleNumber: 100,
      cidrBlock: "0.0.0.0/0",
      egress: true,
    });

    // Inboundエントリ
    new CfnNetworkAclEntry(scope, context.getResourceName(this.resourceName)+"-inbound-entry", {
      networkAclId: networkAcl.ref,
      protocol: -1,
      ruleAction: "allow",
      ruleNumber: 100,
      cidrBlock: "0.0.0.0/0",
      egress: false,
    });

    // Subnetとの関連付け
    this.subnetAssosiations.forEach((assosiation) => {
      if(assosiation.subnet == null){
        throw new Error("subnet is null");
      }

      new CfnSubnetNetworkAclAssociation(scope,assosiation.id, {
        networkAclId: networkAcl.ref,
        subnetId: assosiation.subnet.raw.ref,
      });
    });

    return new Resource(networkAcl, context.getResourceName(this.resourceName));
  }
}
