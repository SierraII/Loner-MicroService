/* -------------------------------------------------------------------- */
/*
        Rquirements
*/
/* -------------------------------------------------------------------- */

var gulp = require("gulp"),
    fs = require("fs"),
    gutil = require("gulp-util"),
    open = require("gulp-open"),
    jsonfile = require("jsonfile");


/* -------------------------------------------------------------------- */
/*
        Global Variables
*/
/* -------------------------------------------------------------------- */

var heading = function(text){
    gutil.log(gutil.colors.bgYellow.black(" " + text + " "));
}

// short hand exec child process
var child_process = function(exec, addBreaks){

    gutil.log("$ " + exec);

    if(!addBreaks)
        console.log("");

    require("child_process").execSync(exec, { stdio : [0, 1, 2] });

    if(!addBreaks)
        console.log("");

};

// short hand exec child process with response back
var child_process_reponse = function(exec, addBreaks){

    gutil.log("$ " + exec);

    if(!addBreaks)
        console.log("");

    var returned = require("child_process").execSync(exec);

    return returned;

};

var settings = {};
settings = fs.readFileSync("settings.json", "utf8");
settings = JSON.parse(settings);

var solutionSettings = {};

// default selected
var selectedApplication = "loner";
var selectedProject = "loner";
var selectedDeployment = "csv-aggrigator";


/* -------------------------------------------------------------------- */
/*
        Tasks
*/
/* -------------------------------------------------------------------- */

gulp.task("default", function(){
    gulp.start("deploy");
});


// get the environment variables
gulp.task("get_environment", function(){

    // get environment variables
    if(gutil.env.p && gutil.env.d){

        if(gutil.env.a){
            selectedApplication = gutil.env.a;
        }

        selectedProject = gutil.env.p;
        selectedDeployment = gutil.env.d;

        heading("Using Environment: ");
        gutil.log("Project: " + selectedProject);
        gutil.log("Application: " + selectedApplication);
        gutil.log("Deployment: " + selectedDeployment);

    }

});

gulp.task("help", function(){

    console.log("\nUsage: gulp COMMAND\n");
    console.log("Deployment layer for mono applications to Kubernetes and Google Container Registory.\n");

    console.log("Options:");
    console.log("\t-p\t Project specified from settings");
    console.log("\t-d\t Deployment specified from settings\n");

    console.log("Commands:");
    console.log("\tdeploy\t\tDeploy application to a project");
    console.log("\tstop\t\tStop deployment (application) on a project");
    console.log("\tlog\t\tLog deployment (application) on a project");
    console.log("\tscale\t\tScale deployment (application) on a project");
    console.log("\tbuild\t\tBuild mono application\n");

});

gulp.task("deploy", function(){

    gulp.start("get_environment");
    gulp.start("build");
    gulp.start("docker");
    gulp.start("push");
    gulp.start("set_gcloud_config");
    gulp.start("stop");
    gulp.start("run");
    gulp.start("show_pods");
    // gulp.start("describe");
    gulp.start("done");
    gulp.start("log");

});


// build the mono application
gulp.task("build", function(){

    heading("Building Solution...");

    var application = settings.applications[selectedApplication];

    var command = "xbuild /p:Configuration=Release " + application.src + application.sln_path;
    child_process(command);

});


// start and run a deployment
gulp.task("run", function(){

    heading("Running Deployment...");

    var fullRegistryImage = 'gcr.io/' + settings.projects[selectedProject].project + "/" + settings.deployments[selectedDeployment].registry;

    child_process("kubectl run " + settings.deployments[selectedDeployment].name + " --replicas=1 --labels= --image=" + fullRegistryImage + ":latest --port=80");

});


// stop a deployment
gulp.task("stop", function(){

    gulp.start("get_environment");

    var host = settings.projects[selectedProject];

    heading("Stopping Deployment...");

    try{
        child_process("kubectl delete deployments/" + settings.deployments[selectedDeployment].name);
    }
    catch(err){
        gutil.log("Deployment " + settings.deployments[selectedDeployment].name + " doesn\'t exist.");
    }

});

// describe a specific deployment
gulp.task("describe", function(){
    heading("Describing Deployment...");
    child_process("kubectl describe deployment " + settings.deployments[selectedDeployment].name);
});

// show pods
gulp.task("show_pods", function(){
    heading("Getting Pods...");
    child_process("kubectl get pods --selector='run=" + settings.deployments[selectedDeployment].name + "'");
});

// scale a pecific deployment
gulp.task("scale", function(){

    gulp.start("get_environment");

    heading("Scaling Deployable...");

    var replicas = 2;
    child_process("kubectl scale deployment " + settings.deployments[selectedDeployment].name + " --replicas " + replicas);

    gulp.start("describe");

});

// expose a service on a deployment
gulp.task("expose_service", function(){
    heading("Exposing Service...");
    child_process("kubectl expose deployment " + settings.deployments[solution].name + " --type=LoadBalancer --name=" + settings.deployments[solution].name);
});

// done
gulp.task("done", function(){
    heading("Done... Successfully Deployed To Kubernetes.");
});

// set gcloud kubernetes config
gulp.task("set_gcloud_config", function(){

    heading("Setting Google Cloud Config...");

    var project = settings.projects[selectedProject];

    child_process("gcloud container clusters get-credentials " + project.cluster + " \ --zone " + project.region + " --project " + project.project);

});

// create a docker file and build the docker image
gulp.task("docker", function(){

    heading("Creating Docker File and Image....");

    var application = settings.applications[selectedApplication];

    var text = "FROM mono\n";
    text += "ADD " + application.src + application.release + " ./\n";
    text += "ADD " + application.csv + " ./" + "\n";
    text += "CMD mono " + application.exe_file + "\n";

    // write file
    fs.writeFileSync("Dockerfile", text);

    gutil.log("Docker Created Successfully.");
    gutil.log("Creating Docker Image...");

    var command = "docker build -t '" + settings.deployments[selectedDeployment].registry + ":latest' ./";
    child_process(command);

    gutil.log("Docker Image Created Successfully...");

});


// push the build docker image to the repository
gulp.task("push", function(){

    heading("Pushing Docker Image To Registry.");

    var fullRegistryImage = "gcr.io/" + settings.projects[selectedProject].project + "/" + settings.deployments[selectedDeployment].registry;

    child_process("docker tag " + settings.deployments[selectedDeployment].registry + ":latest " + fullRegistryImage, true);
    child_process("gcloud docker -- push " + fullRegistryImage + ":latest");

});

// tail the log of the first loggable pod of the deployment
gulp.task("log", function(){

    gulp.start("get_environment");

    heading("Getting Loggable Pods...");

    // get the first pod thats loggable (most recent/newest) based on the creation timestamp
    var output = child_process_reponse("kubectl get pods --output=json --selector='run=" + settings.deployments[selectedDeployment].name + "' --sort-by='.metadata.creationTimestamp'");

    var out = String.fromCharCode.apply(null, new Uint16Array(output));
    out = JSON.parse(out);

    var podName = out.items[(out.items.length - 1)].metadata.name;

    gutil.log("Attempting To Log " + podName);

    child_process("kubectl logs -f " + podName);

});


// start an admin kubernetes server
gulp.task("admin", function(){

    heading("Starting Admin Server...");
    gutil.log("Open http://localhost:8001/ui in local brower.");

    gulp.start("proxy");

});

gulp.task("proxy", function(){
    gulp.start("set_gcloud_config");
    child_process("kubectl proxy");
});
