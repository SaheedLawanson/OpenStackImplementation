# OpenStack Service Integration and Instance Management
## Overview

This Node.js service integrates with OpenStack APIs to manage and retrieve instance data.

## Features
- OpenStack API Integration:
    - Authenticate using OpenStack Keystone API
    - Fetch a token and list available instances
- Simulated Instance Creation:
    - Mock Implementation for creating instances with parametrized configuration
        - VPC: Supports network isolation through security group managment and subnets
        - Instance Type and Subnets: Allows specification of parameters like CPU, RAM and Subnets
- Error Handling
    - Centralized error handler for validation and unexpected issues
- Validation:
    - Input schema validation using yup


## Installation
1. Clone the repository
```
git clone https://github.com/SaheedLawanson/OpenStackImplementation
cd OpenStackImplementation
```

2. Install Dependencies
```
npm install
```

3. Setup environment variables in a `.env` file
```
KEYSTONE_BASE_URL=<Keystone API Base URL>
CINDER_BASE_URL=<Cinder API Base URL>
NOVA_BASE_URL=<Nova API Base URL>
OS_PROJECT_NAME=<Project Name>
OS_PROJECT_DOMAIN_ID=<Project Domain ID>
OS_USERNAME=<Username>
OS_USER_DOMAIN_NAME=<User Domain Name>
OS_PASSWORD=<Password>
```

4. Start the service
```
npm start
```

## Future Improvements
- Multi-cloud Support: Add AWS integration to enable seamless multi-cloud management.
- Database: Store instance data in a database for persistence.
- Testing: Write unit and integration tests to ensure reliability.
- Technical Depth: Add more parameters like exact storage capacity (block storage), additional endpoints to see the existing resources