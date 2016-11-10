'use strict';

const csv = require('csv-parse');
const fs = require('fs');
const zpad = require('zpad');
const yaml = require('js-yaml');
const jwt = require('jsonwebtoken');
const mkdirp = require('mkdirp');
const getDirName = require('path').dirname;

let exists = (file) => {
  try {
    let stat = fs.statSync(file);
    return stat.isFile();
  } catch (err) {
    return false;
  }
};

let clearContent = true;
let writeTitle = true;

exports.writeFile = (path, content) => {
  try {
    let body = content;
    if (typeof content === 'object') {
      body = JSON.stringify(content, null, 2);
    }
    mkdirp(getDirName(path), () => {
      fs.writeFile(path, body);
    });
  } catch (err) {
    console.error(err);
  }
};

exports.writeReadmeFile = (config) => {
  try {
    let path = `${config.basePath}/readme.md`;

    mkdirp(getDirName(path), () => {
      if (clearContent) {
        fs.writeFile(path, `# ${config.project}\n`);
        clearContent = false;
      }

      let businessRules = config.businessRules;
      if (typeof businessRules === 'object') {
        fs.appendFile(path, '## Business Rules \n\n');
        for (let key in businessRules) {
          if (businessRules.hasOwnProperty(key)) {
            fs.appendFile(path, '  * ' + businessRules[key] + '\n');
          }
        }

        fs.appendFile(path, '\n');
      }

      let toRun = config.toRun;
      if (typeof config.toRun === 'object') {
        fs.appendFile(path, '## To Run\n\n  ```\n  ');
        for (let key in toRun) {
          if (toRun.hasOwnProperty(key)) {
            fs.appendFile(path, toRun[key] + '\n  ');
          }
        }
        fs.appendFile(path, '```\n\n');
      }
    });
  } catch (err) {
    console.error(err);
  }
};

exports.writeOnExistingFile = (config, req) => {
  try {
    let path = `${config.basePath}/readme.md`;
    let description = req.description;
    if (typeof description === 'object') {
      description = JSON.stringify(description, null, 2);
    }

    mkdirp(getDirName(path), () => {
      if (writeTitle) {
        fs.appendFile(path, '## Automated Test Cases\n');
        writeTitle = false;
      }
      fs.appendFile(path, `${zpad(req.id)}. ${req.description}` +
        '\n\n ```\n  * method: ' + req.method +
        '\n  * status: ' + req.validate.statusCode +
        '\n  * path: ' + req.path + '\n ```\n');
    });
  } catch (err) {
    console.error(err);
  }
};

let parseJsonSafe = exports.parseJsonSafe = (body) => {
  try {
    if (typeof body === 'object') return body;
    return JSON.parse(body);
  } catch (err) {
    return body;
  }
};

exports.createJwt = (json, secret) => {
  if (!json) return null;
  try {
    return jwt.sign(json, secret);
  } catch (err) {
    console.error(err);
    return null;
  }
};

exports.loadJsonOrParse = (basePath, jsonOrFile) => {
  let filePath = `${basePath}/${jsonOrFile}`;
  if (!exists(filePath)) {
    return parseJsonSafe(jsonOrFile);
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(err);
    return null;
  }
};

exports.loadFile = (basePath, jsonOrFile) => {
  let filePath = `${basePath}/${jsonOrFile}`;
  if (!exists(filePath)) {
    return jsonOrFile;
  }
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(err);
    return null;
  }
};

exports.loadTextFile = (basePath) => {
  let filePath = `${basePath}`;

  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(err);
    return null;
  }
};

exports.loadYAMLOrParse = (basePath, yamlOrFile) => {
  let filePath = `${basePath}/${yamlOrFile}`;
  if (!exists(filePath)) {
    return parseJsonSafe(yamlOrFile);
  }
  try {
    return yaml.safeLoad(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(err);
    return null;
  }
};

exports.parseCSV = (file) => {
  if (!exists(file)) return null;
  return new Promise((resolve, reject) => {
    var parser = csv(
      { delimiter: ',', columns: true },
      (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
        parser.end();
      });
    fs.createReadStream(file).pipe(parser);
  });
};
