import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const { name, grade, section, subject, teacher_id } = await request.json()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Insert class
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .insert([
        {
          name,
          grade,
          section,
          subject,
          teacher_id,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (classError) throw classError

    return NextResponse.json({
      message: 'Class assigned successfully',
      class: classData
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to assign class' },
      { status: 400 }
    )
  }
}

export async function GET(request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    // Get classes
    const query = supabase
      .from('classes')
      .select(`
        *,
        teacher:profiles(id, full_name, email)
      `)
      .order('created_at', { ascending: false })

    if (teacherId) {
      query.eq('teacher_id', teacherId)
    }

    const { data: classes, error } = await query

    if (error) throw error

    return NextResponse.json({ classes })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch classes' },
      { status: 400 }
    )
  }
}

export async function DELETE(request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('id')

    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 })
    }

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete class
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId)

    if (error) throw error

    return NextResponse.json({ message: 'Class deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete class' },
      { status: 400 }
    )
  }
}