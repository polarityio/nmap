'use strict';

const { exec } = require('child_process');
const { AddressError, Address4 } = require('ip-address');

let Logger;

function startup(logger) {
  Logger = logger;
}

const defaultValues = {
  scanType: '-sT',
  topPorts: 64,
  arguments: '-T4 -Pn',
  timeout: 30000
};

function doLookup(entities, options, cb) {
  let lookupResults = [];

  entities.forEach((entityObj) => {
    if (!options.privateIpOnly || (options.privateIpOnly && entityObj.isIP && entityObj.isPrivateIP)) {
      lookupResults.push({
        entity: entityObj,
        isVolatile: true,
        data: {
          summary: ['Ready to scan'],
          details: {
            topPorts: options.topPorts
          }
        }
      });
    }
  });

  cb(null, lookupResults);
}

function onMessage(message, options, cb) {
  if (message.action === 'scan') {
    this.scanTarget = message.entity;

    // Ensure the scanTarget is a valid IPv4 address
    try {
      new Address4(this.scanTarget);
    } catch (invalidIpError) {
      Logger.error({ message: invalidIpError.message, parseMessage: invalidIpError.parseMessage }, 'Parse Message');
      cb({
        detail: invalidIpError.message
      });
      return;
    }

    const command = `nmap ${defaultValues.scanType} -top-ports ${options.topPorts} ${defaultValues.arguments} ${this.scanTarget}`;
    exec(command, { encoding: 'utf-8' }, (err, stdout, stderr) => {
      if (err) {
        Logger.error(err);
        cb({
          detail: err
        });
        return;
      }

      cb(null, {
        reply: stderr ? stderr.trim() : stdout.trim()
      });
    });
  }
}

module.exports = {
  startup,
  doLookup,
  onMessage
};
