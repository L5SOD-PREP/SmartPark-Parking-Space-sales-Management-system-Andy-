import React from 'react';
import { FiInbox } from 'react-icons/fi';

function EmptyState({ title = 'No data found', description = 'Nothing to display yet.', icon: Icon = FiInbox }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Icon className="text-gray-400" size={36} />
            </div>
            <h3 className="text-lg font-semibold text-gray-600">{title}</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">{description}</p>
        </div>
    );
}

export default EmptyState;
