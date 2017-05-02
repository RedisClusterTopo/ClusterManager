# redtop-server

The Redtop server is responsible for coonecting to and acquiring information from ec2 as well as redis.The server also contains all of the parsing and error detection functionality that Redtop offers. The server could potentially be used on its own(with some changes to the gulp file and the server code) do to the fact that we do provide a rest api. As with the client all of the setup is done within the redtop solution.

The server contains the following:

server/public
    aws-login.html - This the html source for the login page to redtop. The login page is where the user supplies the aws ec2 information if not running a local cluster.
    index.html     - This is the html source for the main page of Redtop. It also contains the css and javascript for the legend.

server/src/css
    availabilityZoneRect.css - Css file to be used by graphics.js on the client side in order to display AWS elements on index.html
    button.css               - Css for the button located on the infobar/side menu.
    sideMenu.css             - Css for the infobar/side menu.
    tree.css                 - Css for the actual cluster topology

server/src/js
    ClusterCmdManager.js     - This file utilizes ioredis in order to construct to calls to a redis cluster and return key information required for parsing. The
                               commands currently used are "cluster nodes"  and "cluster info." These are called from the ClusterToken file and eventally sent to the redtop parser to create the redtop object.

    ClusterManager.js        - This file is responsible for handling all of the user tokens that are currently being used by Redtop. We can add, del, and check for
                               uniqueness here. There is also a case for using a local cluster but this is usually for debugging purposes.

    ClusterToken.js          - Cluster token is our center piece for the server. It is responsible for handling communication between all of the other "modules" within
                               the server. From here we handle all of the calls to get ec2 information and redis information. We also handle the api calls here as well.    

    QueryManager.js          - This file handles communication with AWS and gets all of the necessary ec2 tags we need to communicate with a cluster.

    RedtopParser.js          - This file handles all of the parsing of redis and ec2 information. We use all of the information that we acquired from the querymanager
                               and the clusterCMDManager. We also have a section that will handle generating a local cluster by creating some dummy ec2 information. 

