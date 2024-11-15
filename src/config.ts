type OpenStackConfig = {
    keystone_url: string,
    cinder_url: string,
    nova_url: string,
    project_name: string,
    project_domain_id: string,
    username: string,
    user_domain_name: string,
    password: string,
}

export const getOpenStackConfig = () => {
    console.log("getOpenStackConfig::INFO::Populating config")

    const res =  {
        keystone_url: process.env.KEYSTONE_BASE_URL,
        cinder_url: process.env.CINDER_BASE_URL,
        nova_url: process.env.NOVA_BASE_URL,
        project_name: process.env.OS_PROJECT_NAME,
        project_domain_id: process.env.OS_PROJECT_DOMAIN_ID,
        username: process.env.OS_USERNAME,
        user_domain_name: process.env.OS_USER_DOMAIN_NAME,
        password: process.env.OS_PASSWORD,
    }

    Object.values(res).forEach(value => {
        if (!value) throw `${value} is missing in config`
    })

    return res as OpenStackConfig
}