"use client"
import React from 'react'

export function Card({ className = '', children, ...props }) {
  return (
    <div className={`rounded-xl border bg-white/70 dark:bg-black/20 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div className={`px-4 py-3 border-b flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children, ...props }) {
  return (
    <h3 className={`font-medium ${className}`} {...props}>
      {children}
    </h3>
  )
}

export function CardContent({ className = '', children, ...props }) {
  return (
    <div className={`p-4 space-y-3 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className = '', children, ...props }) {
  return (
    <div className={`px-4 py-3 border-t ${className}`} {...props}>
      {children}
    </div>
  )
}


