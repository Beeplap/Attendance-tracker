"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { MoreHorizontal } from "lucide-react";
import { Menu, Transition } from "@headlessui/react";

export default function UsersTable({
  profiles,
  listLoading,
  fetchProfiles,
  deleteUser,
  filteredProfiles,
}) {
  return (
    <Card className="shadow-md border border-gray-200 dark:border-gray-700">
      <CardHeader className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Users
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {profiles.filter((p) => p.role === "admin").length} admins,{" "}
            {profiles.filter((p) => p.role === "teacher").length} teachers,{" "}
            {profiles.filter((p) => p.role === "student").length} students
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchProfiles}
          disabled={listLoading}
          className="border-gray-400 text-gray-700 dark:text-gray-200"
        >
          {listLoading ? "Refreshing…" : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sr-only sm:not-sr-only">
              <tr className="text-left border-b bg-gray-100 dark:bg-gray-800">
                <th className="py-2 px-2 sm:px-4">User</th>
                <th className="py-2 px-2 sm:px-4 hidden sm:table-cell">
                  Email
                </th>
                <th className="py-2 px-2 sm:px-4">Role</th>
                <th className="py-2 px-2 sm:px-4 hidden sm:table-cell">
                  Joined
                </th>
                <th className="py-2 px-2 sm:px-4 w-12 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.map((p, idx) => (
                <tr
                  key={p.id}
                  className={`border-b last:border-0 ${
                    idx % 2 === 0 ? "bg-white/50 dark:bg-gray-900/40" : ""
                  }`}
                >
                  <td className="py-2 px-2 sm:px-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                      <span className="font-medium">
                        {p.full_name || p.id}
                      </span>
                      <span className="text-xs text-gray-500 sm:hidden">
                        {p.email}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-2 sm:px-4 hidden sm:table-cell">
                    {p.email}
                  </td>
                  <td className="py-2 px-2 sm:px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium text-white
                            ${
                              p.role === "admin"
                                ? "bg-red-500"
                                : p.role === "teacher"
                                ? "bg-blue-500"
                                : "bg-green-500"
                            }`}
                    >
                      {p.role || "student"}
                    </span>
                  </td>
                  <td className="py-2 px-2 sm:px-4 text-xs opacity-70 hidden sm:table-cell">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-2 sm:px-4">
                    <div className="flex justify-end">
                      <Menu
                        as="div"
                        className="relative inline-block text-left"
                      >
                        <Menu.Button
                          as={Button}
                          variant="ghost"
                          size="sm"
                          className="p-1.5 sm:p-2"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Menu.Button>
                        <Transition
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right rounded-md border bg-white dark:bg-gray-900 shadow-lg focus:outline-none">
                            <div className="py-1">
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => deleteUser(p.id)}
                                    className={`${
                                      active
                                        ? "bg-gray-100 dark:bg-gray-800"
                                        : ""
                                    } flex w-full px-3 py-2 text-left text-sm text-red-600`}
                                  >
                                    Delete
                                  </button>
                                )}
                              </Menu.Item>
                            </div>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProfiles.length === 0 && (
                <tr>
                  <td className="py-4 text-center opacity-70" colSpan={5}>
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
