#!/usr/bin/env node
const [ , , ...args ] = process.argv
const { exec } = require('child_process')

const zone = `us-west1-b`
const project = `infanger`

const terraVer = `0.11.13`
const terraZip = `terraform_${terraVer}_linux_amd64.zip`
const terraUrl = `https://releases.hashicorp.com/terraform/${terraVer}/${terraZip}`

switch (args[ 0 ]) {
  case 'create':
    createInstance(args[ 1 ]); break
  case 'delete':
    deleteInstance(args[ 1 ]); break
  case 'update':
    updateInstance(args[ 1 ]); break
  default:
    console.log("Please specify the Action followed by a GCE instance name"); break
}

function createInstance(name) {
  console.log(`Attempting deployment of GCE instance: ${name}`)
  exec(`gcloud compute instances create ${name}`, (error, stdout, stderr) => {
    logOutput(error, stdout, stderr)
    if (!error) { instanceIP(name) }
  })
}

function instanceIP(name) {
  exec(`gcloud compute instances list --filter=name=${name} --format="value[](EXTERNAL_IP)"`, (error, stdout, stderr) => {
    logOutput(error, stdout, stderr)
    if (!error) { sshAlias() }
  })
}

function sshAlias() {
  console.log("Updating local ~/.ssh/config alias")
  exec(`gcloud compute config-ssh`, (error, stdout, stderr) => {
    logOutput(error, stdout, stderr)
  })
}

function updateInstance(name) {
  console.log(`Updating ${name} and installing Terraform`)
  let alias = `${name}.${zone}.${project}`
  exec(`ssh ${alias} "wget ${terraUrl}; sudo apt update; sudo apt install unzip; unzip ${terraZip}"`, (error, stdout, stderr) => {
    logOutput(error, stdout, stderr)
  })
}

function deleteInstance(name) {
  console.log(`Attempting teardown of GCE instance: ${name}`)
  // quiet use for avoid yes/no prompt
  exec(`gcloud compute instances delete ${name} --quiet`, (error, stdout, stderr) => {
    logOutput(error, stdout, stderr)
    // no stdout with --quiet flag
    if (!error) { console.log(`${name} deleted successfully.`) }
  })
}

function logOutput(error, stdout, stderr) {
  (error) ? console.log(`${stderr}${error}`) : console.log(stdout)
}