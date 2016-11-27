# ClusterManager

The goal of this project is to provide a visualization tool designed to improve quality of life in managing Redis Cluster deployments. The primary problem to be addressed is the current lack of an efficient way to visualize the configuration of a Redis Cluster deployment on a cloud environment. Currently developers must rely on self-made tooling or interpret a bulk of console ouput to gain any meaningful information about the Cluster state, which can make the administrative process tedious.

This tool will be delivered as a web app leveraging the ioredis library (https://github.com/luin/ioredis/) via Node.js to query Redis Cluster for information about a given deployment's topology and relay that information to client browsers. From there information will be parsed and a Cluster topology will be generated.

As of now, we are specific to the AWS platform. Due the the problem of NAT, current versions of the app require the deployment to within the VPC hosting Redis Cluster. Future versions may allow for deployment outside of the VPC with the option of using a public-facing forwarding instance to route TCP connections to private addresses running Redis Cluster. This will, however, act as a potential bottleneck.



#Setup

In order to use the app, you will need to add certain tags to your EC2 instances. 

1) A tag common to all your instances to identify the machines running Redis Cluster

2) Tags identifying the node type and port over which they run. i.e. Key = 'master'      Value = '7000'
  Instances may have multiple master or slave tags.
  
PlLEASE NOTE: ioredis will not require all of your nodes to be tagged in order to connect to your cluster. If you have a sizeable deployment, it will suffice to tag a small number of nodes - ioredis will autodiscover the remaining nodes so long as a sufficient amount are reachable.


# Group Members: 

Alex Kiefer 

  akiefer6@gmail.com
  
  https://github.com/alkief/
  
Cory Stonitsch

  corystonitsch@gmail.com
  
  https://github.com/astonitsching/
  
Chris Bendt

  christophermbendt@gmail.com
  
  https://github.com/daholyfork/
