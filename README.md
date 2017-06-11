Loner Micro-Service Deployment 
======
Automated Mono application deployment to Kubernetes.
<p align="center">
    <br/>
    <img width = "200" src="https://www.gcppodcast.com//images/post/Kubernetes.png" alt=""/>
    <img width = "200" src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Npm-logo.svg/2000px-Npm-logo.svg.png" alt="" style="margin:5px;"/>
     <img width = "200" src="https://www.programmableweb.com/sites/default/files/styles/large/public/Screen%20Shot%202014-07-18%20at%201.01.50%20PM.jpg?itok=eyGmmGGt" alt=""/>
    <br/>
    <br/>
    <img width = "200" src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Node.js_logo.svg/1200px-Node.js_logo.svg.png" alt=""/>
    <img height = "200" src="https://avatars0.githubusercontent.com/u/6200624?v=3&s=400" alt=""/>
    <img width = "200" src="https://d3nmt5vlzunoa1.cloudfront.net/phpstorm/files/2015/10/large_v-trans.png" alt=""/>
</p>

## Description
The purpose of thie repository is to demonstrate a deployment to Kubernetes on the Google Cloud Platform. The Gulp script will compile the <a href="https://github.com/SierraII/Loner">Loner application</a>, create a docker image for the application, push the docker image to a private Google Cloud project's Container Registory, and run the docker image with pre-setup Kubernetes clusters and nodes.

If you would like to run the application on your own Google Cloud project, place the project information within the "settings.json" file.

If you would like access to the Google Cloud project, feel free to email me a gmail address.

## Process and Deployment Information
- The script first compiles the application vai mono.
- Once the application has been built, the deployment script creates a docker file for the application and builds the Docker image.
- The deployment will then push the Docker image to Google Container Registory.
- The deployment checks for any running deployment (applications) running within the project cluster and deletes the deployment (application) if it finds one with the relavent name.
- The deployment (application) will then create a replica set set to create one single pod (which can be scaled up manually vai this deployment script). If any running process of this pod has changed, the pod will restart. More information on pods and replica-sets can be found <a href="https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/">here</a>
- After starting the pod, the script log attempt to log the most recently created pod.

## Demo
<p align="center">
    <a href="https://youtu.be/qjeXqvBRCL8"><img width="300" src="https://img.youtube.com/vi/qjeXqvBRCL8/0.jpg" alt=""/></a>
</p>

## Setup and Requirements
Install [node.js](https://nodejs.org/en/download/)  
Install [docker](https://www.docker.com/)  
Install [Google Cloud SDK](https://cloud.google.com/sdk/) 

Open your terminal and cd into the directory
```
cd your/directory/of/Loner-MicroService
```
Install the KubernetesCLI vai the Google Cloud SDK
```
gcloud components install kubectl
```
Install the NPM packages
```
npm install
```
Type "gulp help" for a list of commands
```
gulp help
```

## Extending
If you would like to add multiple projects, regions or clusters to deploy to, simply add the various information into the settings.json file.
