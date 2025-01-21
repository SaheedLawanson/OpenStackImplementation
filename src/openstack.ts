import * as config from "./config";

type OpStackDomain = {
  id: string;
  name: string;
};

type OpStackRole = {
  id: string;
  name: string;
};

enum IpProtocol {
  tcp = "tcp",
  ssh = "ssh",
  icmp = "icmp",
}

type OpsStackEntity = {
  domain: OpStackDomain;
  id: string;
  name: string;
  password_expires_at?: Date;
};

type OpStackAuthResponse = {
  methods: string[];
  token: {
    methods: string[];
    user: OpsStackEntity;
    audit_ids: string[];
    expires_at: string;
    issued_at: string;
    project: OpsStackEntity;
    is_domain: false;
    roles: OpStackRole[];
  };
};

type OpStackSecurityGroupRule = {
  id: string;
  parent_group_id: string;
  ip_protocol: string;
  from_port: number;
  to_port: number;
  group: any;
  ip_range: { cidr: string };
};

type OpStackSecurityGroup = {
  id: string;
  description: string;
  name: string;
  tenant_id: string;
  rules: OpStackSecurityGroupRule;
};

type OpStackLink = {
  rel: string;
  href: string;
};

type OpStackMachineImage = {
  id: string;
  name: string;
  minRam: number;
  minDisk: number;
  metadata: any;
  created: string;
  updated: string;
  status: "ACTIVE" | "INACTIVE";
  progress: number;
  "OS-EXT-IMG-SIZE:size": number;
  links: OpStackLink[];
};

type OpStackItem = {
  id: string;
  name?: string;
  links: OpStackLink[];
};

type DummyCache = {
  opStackAuthData: (OpStackAuthResponse & { accessToken: string }) | null;
};

type OpStackServer = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  tenant_id: string;
  user_id: string;
  hostId: string;
  image: string;
  flavor: OpStackItem;
  created: string;
  updated: string;
  addresses: {
    private: OpStackServerAddress[];
  };
  accessIpv4: string;
  accessIpv6: string;
  links: OpStackLink[];
  security_groups: { name: string }[];
  "OS-EXT-SRV-ATTR:host": string;
  "OS-EXT-SRV-ATTR:instance_name": string;
  "OS-EXT-SRV-ATTR:hypervisor_hostname": string;
  "OS-EXT-STS:task_state"?: string;
  "OS-EXT-STS:vm_state": string;
  "OS-EXT-STS:power_state": number;
  "os-extended-volumes:volumes_attached": { id: string }[];
  "OS-SRV-USG:launched_at": string;
  "OS-SRV-USG:terminated_at"?: string;
};

type OpStackServerAddress = {
  version: 4 | 6;
  addr: string;
  "OS-EXT-IPS:type": string;
  "OS-EXT-IPS-MAC:mac_addr": string;
};

type OpStackFlavor = {
  id: string;
  name: string;
  ram: number;
  disk: number;
  swap: string;
  "OS-FLV-EXT-DATA:ephemeral": number;
  "OS-FLV-DISABLED:disabled": boolean;
  vcpus: number;
  "os-flavor-access:is_public": boolean;
  rxtx_factor: number;
  links: OpStackLink[];
};

const dummy_cache: DummyCache = {
  opStackAuthData: null,
};

const authTokenIsValid = (data: OpStackAuthResponse | null) => {
  // console.log("authTokenIsValid::INFO::Checking if token is valid");
  return !!data?.token && new Date(data.token.expires_at) < new Date();
};

export const authenticate = async () => {
  if (authTokenIsValid(dummy_cache["opStackAuthData"])) {
    // console.log(
    //   `openstack.authenticate::DEBUG::Reusing cached token: ${JSON.stringify(
    //     dummy_cache
    //   )}`
    // );
    return dummy_cache["opStackAuthData"]!.accessToken;
  }

  console.log(`openstack.authenticate::INFO::Fetching token from provider`);
  const opStackCfg = config.getOpenStackConfig();

  const res = await fetch(`${opStackCfg.keystone_url}/v3/auth/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth: {
        identity: {
          methods: ["password"],
          password: {
            user: {
              name: "admin",
              domain: { name: opStackCfg.user_domain_name },
              password: opStackCfg.password,
            },
          },
        },
        scope: {
          project: {
            name: opStackCfg.project_name,
            domain: {
              name: opStackCfg.user_domain_name,
            },
          },
        },
      },
    }),
  });
  // console.log(
  //   `openstack.authenticate::DEBUG::Provider response: ${res.status}`
  // );

  if (res.status !== 201) throw "An error occurred during authentication";

  const data: OpStackAuthResponse = await res.json();
  dummy_cache["opStackAuthData"] = {
    ...data,
    accessToken: res.headers.get("X-Subject-Token") as string,
  };

  return dummy_cache["opStackAuthData"]!.accessToken;
};

export const createSecurityGroup = async (
  name: string,
  description?: string
) => {
  const opStackCfg = config.getOpenStackConfig();

  const res = await fetch(`${opStackCfg.nova_url}/os-security-groups`, {
    method: "POST",
    body: JSON.stringify({ name, description }),
    headers: {
      "X-Auth-Token": await authenticate(),
      "Content-Type": "application/json",
    },
  });

  if (res.status !== 200)
    throw "An error occurred while creating security group";

  const data: { security_group: OpStackSecurityGroup } = await res.json();

  return data.security_group.id;
};

export const createSecurityGroupRule = async (
  securityGroupId: string,
  portRange: [number, number],
  ipProtocol: IpProtocol = IpProtocol.tcp,
  cidr: string = "0.0.0.0/0"
) => {
  const opStackCfg = config.getOpenStackConfig();

  const res = await fetch(`${opStackCfg.nova_url}/os-security-group-rules`, {
    method: "POST",
    body: JSON.stringify({
      parent_group_id: securityGroupId,
      ip_protocol: ipProtocol,
      from_port: portRange[0],
      to_port: portRange[1],
      cidr,
    }),
    headers: {
      "X-Auth-Token": await authenticate(),
      "Content-Type": "application/json",
    },
  });

  if (res.status !== 200)
    throw "An error occurred while creating security group rule";

  const data: { security_group_rule: OpStackSecurityGroupRule } =
    await res.json();

  return data.security_group_rule.id;
};

export const listMachineImages = async () => {
  const opStackCfg = config.getOpenStackConfig();

  const res = await fetch(`${opStackCfg.nova_url}/images`, {
    headers: {
      "X-Auth-Token": await authenticate(),
      "Content-Type": "application/json",
    },
  });

  if (res.status !== 200)
    throw "An error occurred while fetching machine images";

  const data: { images: OpStackItem[] }[] = await res.json();

  return data;
};

export const getMachineImageById = async (imageId: string) => {
  const opStackCfg = config.getOpenStackConfig();

  const res = await fetch(`${opStackCfg.nova_url}/images/${imageId}`, {
    headers: {
      "X-Auth-Token": await authenticate(),
      "Content-Type": "application/json",
    },
  });

  if (res.status !== 200)
    throw "An error occurred while fetching machine image";

  const data: { image: OpStackMachineImage } = await res.json();

  return data;
};

export const createInstance = async (
  flavorId: string,
  imageId: string,
  name: string,
  securityGroups?: { name: string }[],
  networkId?: string,
  fixedIp?: string,
) => {
  const opStackCfg = config.getOpenStackConfig();

  if (networkId && fixedIp)
    throw "Only one of networkId or fixedIp can be provided";

  const res = await fetch(`${opStackCfg.nova_url}/os-security-group-rules`, {
    method: "POST",
    body: JSON.stringify({
      flavorRef: flavorId,
      imageRef: imageId,
      name,
      security_groups: securityGroups,
      ...(networkId ? { networks: [{ uuid: networkId }] } : {}),
      ...(fixedIp ? { networks: [{ fixed_ip: fixedIp }] } : {}),
    }),
    headers: {
      "X-Auth-Token": await authenticate(),
      "Content-Type": "application/json",
    },
  });

  if (res.status !== 200) throw "An error occurred while creating server";

  const data: { security_group_rule: OpStackSecurityGroupRule } =
    await res.json();

  return data.security_group_rule.id;
};

export const listInstances = async () => {
  const opStackCfg = config.getOpenStackConfig();

  const res = await fetch(`${opStackCfg.nova_url}/servers`, {
    headers: {
      "X-Auth-Token": await authenticate(),
      "Content-Type": "application/json",
    },
  });

  if (res.status !== 200) throw "An error occurred while fetching servers";

  const data: { servers: OpStackItem[] } = await res.json();

  return data;
};

export const getInstanceById = async (server_id: string) => {
  const opStackCfg = config.getOpenStackConfig();

  const res = await fetch(`${opStackCfg.nova_url}/servers/${server_id}`, {
    headers: {
      "X-Auth-Token": await authenticate(),
      "Content-Type": "application/json",
    },
  });

  if (res.status !== 200) throw "An error occurred while fetching server";

  const data: { server: OpStackServer } = await res.json();

  return data;
};

export const listNetworks = async () => {
  const opStackCfg = config.getOpenStackConfig();

  const res = await fetch(`${opStackCfg.nova_url}/os-networks`, {
    headers: {
      "X-Auth-Token": await authenticate(),
      "Content-Type": "application/json",
    },
  });

  if (res.status !== 200) throw "An error occurred while fetching networks";

  const data: { networks: { id: string; label: string }[] } = await res.json();

  return data;
};

export const getNetwork = async (network_id: string) => {
  const opStackCfg = config.getOpenStackConfig();

  const res = await fetch(`${opStackCfg.nova_url}/os-networks/${network_id}`, {
    headers: {
      "X-Auth-Token": await authenticate(),
      "Content-Type": "application/json",
    },
  });

  if (res.status === 404) return;
  if (res.status !== 200) throw "An error occurred while fetching network";

  const data: { network: { id: string; label: string }[] } = await res.json();

  return data;
};

export const listFlavors = async () => {
  const opStackCfg = config.getOpenStackConfig();

  const res = await fetch(`${opStackCfg.nova_url}/flavors`, {
    headers: {
      "X-Auth-Token": await authenticate(),
      "Content-Type": "application/json",
    },
  });

  if (res.status !== 200) throw "An error occurred while fetching flavors";

  const data: { flavors: OpStackItem[] } = await res.json();

  return data;
};

export const getFlavor = async (flavor_id: string) => {
  const opStackCfg = config.getOpenStackConfig();

  const res = await fetch(`${opStackCfg.nova_url}/flavors/${flavor_id}`, {
    headers: {
      "X-Auth-Token": await authenticate(),
      "Content-Type": "application/json",
    },
  });

  if (res.status === 404) return;
  if (res.status !== 200) throw "An error occurred while fetching flavors";

  const data: { flavor: OpStackFlavor[] } = await res.json();

  return data;
};
