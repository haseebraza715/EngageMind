import React from 'react';
import Card from './UI/Card';
import Button from './UI/Button';

const ErrorDisplay = ({ error, onRetry }) => (
  <div className="flex items-center justify-center min-h-screen p-4">
    <Card variant="glass" className="max-w-md w-full text-center">
      <div className="text-red-500 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h3>
      <p className="text-gray-600 mb-6">{error || 'An unexpected error occurred'}</p>
      <Button
        onClick={onRetry || (() => window.location.reload())}
        variant="primary"
        className="w-full"
      >
        Try Again
      </Button>
    </Card>
  </div>
);

export default ErrorDisplay;