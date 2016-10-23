# ClusterManager

The goal of this project is to provide a visualization tool designed to improve quality of life in managing Redis Cluster deployments. The primary problem to be addressed is the current lack of an efficient way to visualize the configuration of a Redis Cluster deployment on a cloud environment. Currently developers must rely on self-made tooling or interpret a bulk of console ouput to gain any meaningful information about the Cluster state, which can make the administrative process tedious.

This tool will be delivered as a web app leveraging the ioredis library (https://github.com/luin/ioredis/) via Node.js to query Redis Cluster for information about a given deployment's topology and relay that information to client browsers. From there information will be parsed and a Cluster topology will be generated.

# Group Members: 

Alex Kiefer 
  akiefer6@gmail.com
  https://github.com/alkief/
  
Cory Stonitsch
  corystonitsch@gmail.com
  
Chris Bendt
  christophermbendt@gmail.com
