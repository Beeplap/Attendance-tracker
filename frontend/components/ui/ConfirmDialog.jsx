"use client";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default", // 'default', 'danger'
}) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md border border-gray-300 dark:border-gray-700 transform transition-all">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                        variant === "danger"
                          ? "bg-red-100 dark:bg-red-900/30"
                          : "bg-blue-100 dark:bg-blue-900/30"
                      }`}
                    >
                      <AlertTriangle
                        className={`w-6 h-6 ${
                          variant === "danger"
                            ? "text-red-600 dark:text-red-400"
                            : "text-blue-600 dark:text-blue-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {title}
                      </Dialog.Title>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {message}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6 justify-end">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {cancelText}
                    </button>
                    <button
                      onClick={() => {
                        onConfirm();
                        onClose();
                      }}
                      className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                        variant === "danger"
                          ? "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                          : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                      }`}
                    >
                      {confirmText}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

