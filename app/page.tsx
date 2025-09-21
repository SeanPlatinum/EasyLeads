"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { API_BASE_URL } from "@/lib/config"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Snowflake, Thermometer } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || "Login failed")
        setIsLoading(false)
        return
      }

      localStorage.setItem("token", data.token)
      window.location.href = "/dashboard"
    } catch (err) {
      alert("Something went wrong")
      setIsLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center p-3 sm:p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=100&width=100')] opacity-10"></div>

      {/* Floating Elements - Hidden on very small screens */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-pulse hidden sm:block"></div>
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-indigo-400/10 rounded-full blur-xl animate-pulse delay-1000 hidden sm:block"></div>
      <div className="absolute top-1/2 left-10 w-24 h-24 bg-pink-400/10 rounded-full blur-xl animate-pulse delay-500 hidden sm:block"></div>

      <Card className="w-full max-w-sm sm:max-w-md backdrop-blur-xl bg-slate-800/20 border-slate-600/30 shadow-2xl mx-3">
        <CardHeader className="text-center space-y-3 sm:space-y-4 p-4 sm:p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
              <Snowflake className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500">
              <Thermometer className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-white">HVAC Lead Tracker</CardTitle>
          <CardDescription className="text-slate-300 text-sm sm:text-base px-2">
            Sign in to manage your Facebook group leads
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200 text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="backdrop-blur-sm bg-slate-800/50 border-slate-600/50 text-slate-100 placeholder:text-slate-400 focus:border-purple-400 focus:ring-purple-400/50 h-11 sm:h-10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200 text-sm">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="backdrop-blur-sm bg-slate-800/50 border-slate-600/50 text-slate-100 placeholder:text-slate-400 focus:border-purple-400 focus:ring-purple-400/50 h-11 sm:h-10"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 sm:py-2 px-4 rounded-lg shadow-lg backdrop-blur-sm border border-slate-600/30 transition-all duration-300 h-12 sm:h-10 text-base sm:text-sm"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
