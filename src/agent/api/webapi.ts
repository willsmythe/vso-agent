// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import ifm = require('./interfaces');
import agentm = require('./agentapi');
import buildm = require('./buildapi');
import timelinem = require('./timelineapi');
import filecontainerm = require('./filecontainerapi');
import taskm = require('./taskapi');

// ---------------------------------------------------------------------------
// factory to return hostapi (for building build host/agents) or buildapi (for querying and queuing builds)
//----------------------------------------------------------------------------
export function AgentApi(serverUrl: string, handler: ifm.IRequestHandler): ifm.IAgentApi {
    return new agentm.AgentApi(serverUrl, handler); 
}

export function QAgentApi(serverUrl: string, handler: ifm.IRequestHandler): ifm.IQAgentApi {
    return new agentm.QAgentApi(serverUrl, handler);    
}

export function QBuildApi(serverUrl: string, handler: ifm.IRequestHandler): ifm.IQBuildApi {
    return new buildm.QBuildApi(serverUrl, handler);    
}

export function QFileContainerApi(serverUrl: string, handler: ifm.IRequestHandler): ifm.IQFileContainerApi {
    return new filecontainerm.QFileContainerApi(serverUrl, handler);    
}

export function TimelineApi(collectionUrl: string, handler: ifm.IRequestHandler): ifm.ITimelineApi {
    return new timelinem.TimelineApi(collectionUrl, handler);   
}

export function TaskApi(serverUrl: string, handler: ifm.IRequestHandler): ifm.ITaskApi {
    return new taskm.TaskApi(serverUrl, handler);
}
