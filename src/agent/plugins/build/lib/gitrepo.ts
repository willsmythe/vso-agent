// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import shell = require('shelljs');
import path = require('path');
import fs = require('fs');
import async = require('async');
var iniparser = require('iniparser');

var shellError = function(ctx, callback) {
    var errMsg = shell.error();
    if (errMsg) {
        ctx.error(errMsg);
        callback(new Error(errMsg));
        return true;
    }

    return false;
}

function _translateRef(ref) {
    var brPre = 'refs/heads/';
    if (ref.startsWith(brPre)) {
        ref = 'refs/remotes/origin/' + ref.substr(brPre.length, ref.length - brPre.length);
    }

    return ref;
}

function _repoExists(repoPath) {
    var repoGitPath = path.join(repoPath, '.git');
    return fs.existsSync(repoGitPath);  
}

function _isRepoOriginUrl(repoPath, url) {
    var isMatch = false;
    var configPath = path.join(repoPath, '.git', 'config');

    if (fs.existsSync(configPath)) {
        var config = iniparser.parseSync(configPath);
        isMatch = config.hasOwnProperty('remote "origin"') && 
                    url.isEqual(true, config['remote "origin"'].url);
    }

    return isMatch;
}

export function getcode(ctx, options, callback) {
    ctx.verbose('cwd: ' + process.cwd());

    var git = shell.which('git');
    if (!git) {
        var msg = 'git is not installed';
        ctx.error(msg);
        callback(new Error(msg));
        return;
    }

    ctx.verbose('Using: ' + git);
    
    ctx.info('Repo: ' + options.repoLocation);
    var inputref = "refs/heads/master";
    if (options.ref && options.ref.trim().length) {
        inputref = options.ref;
    }

    var repoPath = path.resolve(options.localPath);
    ctx.info('Repo path: ' + repoPath);

    // if branch, we want to clone remote branch name to avoid tracking etc.. ('/refs/remotes/...')
    var ref = _translateRef(inputref);
    ctx.info('Using ref: ' + ref);

    var askpass = null;
    if (options.creds) {
        var askPath = path.join(__dirname, 'askpass.js');
        process.env['GIT_ASKPASS']=askPath;
        ctx.info('repo location:' + options.repoLocation);
    }
    
    var repoDirName = path.dirname(repoPath);

    if (options.clean && fs.existsSync(repoDirName)) {
        ctx.info('Cleaning/Deleting repo dir: ' + repoDirName);
        shell.rm('-rf', repoDirName);
    }

    if (!fs.existsSync (repoDirName)) {
        ctx.info('Creating repo dir: ' + repoDirName)
        shell.mkdir('-p', repoDirName);
        if (shellError(ctx, callback)) return;
    }
    shell.cd(repoDirName);
    ctx.info('cwd: ' + process.cwd());

    var repoFolder = path.basename(repoPath);

    var repoExists = _repoExists(repoPath);
    if (repoExists) {
        if (!_isRepoOriginUrl(repoPath, options.repoLocation)) {
            callback(new Error('Repo @ ' + repoPath + ' is not ' + options.repoLocation));
            return;
        }
    }

    var handle = function(err, complete) {
        if (err) { complete(err); }
        complete(); 
    }

    async.series([
        function(complete) {
            ctx.util.spawn('git', ['--version'], {}, function(err){ handle(err, complete); });
        },
        function(complete) {
            if (repoExists) {
                ctx.section('Git fetch');
                shell.cd(repoPath);
                ctx.verbose('cwd: ' + process.cwd());
                if (shellError(ctx, callback)) return;
                ctx.util.spawn('git', ['fetch'], { failOnStdErr: false }, function(err){ handle(err, complete); });
            }
            else {
                ctx.section('Git clone ' + options.repoLocation);
                ctx.info('Cloning into folder: ' + repoFolder);
                ctx.util.spawn('git', ['clone', '--progress', options.repoLocation, repoFolder, '-c', askpass], { failOnStdErr: false }, function(err){
                    if (err) {
                        complete(err);
                    }
                    else {
                        shell.cd(repoPath);
                        if (shellError(ctx, callback)) return;
                        handle(err, complete);
                    }
                });
            }
        },
        function(complete) {
            ctx.section('Git checkout ' + ref + ' ...');
            ctx.util.spawn('git', ['checkout', ref], { failOnStdErr: false }, function(err){ handle(err, complete); });
        },
        function(complete) {
            if (options.submodules) {
                ctx.section('Git submodule init ...');
                ctx.util.spawn('git', ['submodule', 'init'], { failOnStdErr: false }, function(err){ handle(err, complete); });
            }
            else {
                complete(null);
            }
        },
        function(complete) {
            if (options.submodules) {
                ctx.section('Git submodule update ...');
                ctx.util.spawn('git', ['submodule', 'update'], { failOnStdErr: false }, function(err){ handle(err, complete); });
            }
            else {
                complete(null);
            }
        }       
    ], 
    // on complete 
    function(err) {
        if (err) { callback(err); }
        callback();
    });
}
