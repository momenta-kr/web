"use client"

import { Metadata } from "next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Mail, MessageSquare, AlertCircle } from "lucide-react"

const contactSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
  category: z.string().min(1, "문의 유형을 선택해주세요"),
  subject: z.string().min(1, "제목을 입력해주세요"),
  message: z.string().min(10, "문의 내용을 10자 이상 입력해주세요"),
})

type ContactFormData = z.infer<typeof contactSchema>

export default function ContactPage() {
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      category: "",
      subject: "",
      message: "",
    },
  })

  const onSubmit = (data: ContactFormData) => {
    console.log(data)
    toast.success("문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.")
    form.reset()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-2">문의하기</h1>
        <p className="text-muted-foreground mb-8">
          서비스 이용 중 궁금한 점이나 건의사항이 있으시면 아래 양식을 통해
          문의해주세요.
        </p>

        <div className="grid gap-6 mb-8">
          <div className="grid sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  일반 문의
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">
                  서비스 이용 관련 질문이나 건의사항
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  오류 신고
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">
                  데이터 오류, 버그, 시스템 문제 신고
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  제휴 문의
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">
                  비즈니스 제휴 및 협력 관련 문의
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>문의 양식</CardTitle>
            <CardDescription>
              모든 항목을 입력해주세요. 영업일 기준 1-2일 내에 답변드립니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>이름</FormLabel>
                        <FormControl>
                          <Input placeholder="홍길동" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>이메일</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="example@email.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>문의 유형</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="문의 유형을 선택해주세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">일반 문의</SelectItem>
                          <SelectItem value="bug">오류 신고</SelectItem>
                          <SelectItem value="data">데이터 문의</SelectItem>
                          <SelectItem value="partnership">제휴 문의</SelectItem>
                          <SelectItem value="privacy">
                            개인정보 관련
                          </SelectItem>
                          <SelectItem value="other">기타</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>제목</FormLabel>
                      <FormControl>
                        <Input placeholder="문의 제목을 입력해주세요" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>문의 내용</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="문의하실 내용을 자세히 작성해주세요"
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  문의 접수하기
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-medium text-sm mb-2">참고사항</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>
              • 투자 상담이나 종목 추천 관련 문의에는 답변드리지 않습니다.
            </li>
            <li>
              • 주식 시세 데이터 관련 문의는 한국투자증권으로 직접 문의해주세요.
            </li>
            <li>
              • 악의적인 문의나 욕설이 포함된 문의는 답변 없이 삭제될 수
              있습니다.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
